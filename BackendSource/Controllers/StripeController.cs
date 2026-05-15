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
            var team = await _gameService.GetTeamFromGame(gameId);
            if (team == null || string.IsNullOrEmpty(team.StripeAccountId))
                return BadRequest("El equipo del juego no tiene Stripe Connect configurado.");
            const double platformFeePercent = 0.15;
            var totalAmount = (long)(game.Price * 100);
            var platformFee = (long)(totalAmount * platformFeePercent);
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = totalAmount,
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
                SuccessUrl = domain + "/Stripe/success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = domain + "/Stripe/cancel",
                ClientReferenceId = userIdClaim,
                PaymentIntentData = new SessionPaymentIntentDataOptions
                {
                    ApplicationFeeAmount = platformFee,           
                    TransferData = new SessionPaymentIntentDataTransferDataOptions
                    {
                        Destination = team.StripeAccountId,       
                    },
                },
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
            Console.WriteLine("[Stripe] Webhook recibido");
            try
            {
                var connectAccountId = Request.Headers["Stripe-Account"].FirstOrDefault();
                Console.WriteLine($"[Stripe] Cuenta conectada: {connectAccountId ?? "plataforma"}");
                var stripeEvent = EventUtility.ConstructEvent(json,
                    Request.Headers["Stripe-Signature"],
                    _configuration.GetSection("Stripe")["WebhookSecret"],
                    throwOnApiVersionMismatch: false);
                Console.WriteLine($"[Stripe] Evento: {stripeEvent.Type}");
                if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session != null && !string.IsNullOrEmpty(session.ClientReferenceId))
                    {
                        var userId = Guid.Parse(session.ClientReferenceId);
                        var gameId = Guid.Parse(session.Metadata["GameId"]);
                        Console.WriteLine($"[Stripe] Otorgando licencia - Usuario: {userId}, Juego: {gameId}");
                        var result = await _meService.BuyGame(userId, gameId);
                        if (result) Console.WriteLine("[Stripe] ✅ Licencia otorgada con éxito.");
                        else Console.WriteLine("[Stripe] ⚠️ No se pudo otorgar la licencia (¿ya la tiene?).");
                    }
                }
                return Ok();
            }
            catch (Exception e)
            {
                Console.WriteLine($"[Stripe] Error en Webhook: {e.Message}");
                return BadRequest();
            }
        }
    }
}
