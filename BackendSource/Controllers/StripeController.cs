using BackendSource.Services.APIServices;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using System.Security.Claims;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class StripeController : Controller
    {
        private readonly IGameService _gameService;
        private readonly IMeService _meService;
        private readonly IConfiguration _configuration;

        public StripeController(IGameService gameService, IMeService meService, IConfiguration configuration)
        {
            _gameService = gameService;
            _meService = meService;
            _configuration = configuration;
        }

        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] Guid gameId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var game = await _gameService.GetGameFromId(gameId);
            if (game == null) return NotFound("Game not found");

            var domain = "https://localhost:7045"; 

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(game.Price * 100), 
                            Currency = "eur",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = game.GameName,
                                Description = game.GameDescription,
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = domain + "/success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = domain + "/cancel",
                ClientReferenceId = userIdClaim, 
                Metadata = new Dictionary<string, string>
                {
                    { "GameId", gameId.ToString() } 
                }
            };

            var service = new SessionService();
            Session session = await service.CreateAsync(options);

            return Ok(new { url = session.Url });
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            Console.WriteLine("[Stripe] Webhook received");
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json,
                    Request.Headers["Stripe-Signature"], _configuration.GetSection("Stripe")["WebhookSecret"],
                    throwOnApiVersionMismatch: false);

                Console.WriteLine($"[Stripe] Event processed: {stripeEvent.Type}");

                if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
                {
                    var session = stripeEvent.Data.Object as Session;

                    if (session != null)
                    {
                        var userId = Guid.Parse(session.ClientReferenceId);
                        var gameId = Guid.Parse(session.Metadata["GameId"]);

                        Console.WriteLine($"[Stripe] Granting license - User: {userId}, Game: {gameId}");

                        var result = await _meService.BuyGame(userId, gameId);
                        
                        if (result) Console.WriteLine("[Stripe] License granted successfully!");
                        else Console.WriteLine("[Stripe] Error: Could not grant license (does the game exist?)");
                    }
                }

                return Ok();
            }
            catch (Exception e)
            {
                Console.WriteLine($"[Stripe] Webhook error: {e.Message}");
                return BadRequest();
            }
        }
    }
}
