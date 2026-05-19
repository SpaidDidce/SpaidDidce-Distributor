using BackendSource.DataBaseSystem;
using BackendSource.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using System.Security.Claims;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class StripeConnectController(DbContextBa context, IConfiguration configuration) : Controller
    {
        private readonly DbContextBa _context = context;
        private readonly IConfiguration _configuration = configuration;
        
        [Authorize]
        [TeamKey]
        [HttpPost("onboarding")]
        public async Task<IActionResult> CreateOnboardingLink([FromQuery] Guid TeamId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var team = await _context.ProgramersTeams.FirstOrDefaultAsync(t => t.TeamId == TeamId);
            if (team == null) return NotFound("Team not found.");
            if (team.OwnerId != Guid.Parse(userIdClaim)) return Forbid();

            string accountId;
            
            if (!string.IsNullOrEmpty(team.StripeAccountId))
            {
                accountId = team.StripeAccountId;
            }
            else
            {
                var accountService = new AccountService();
                var account = await accountService.CreateAsync(new AccountCreateOptions
                {
                    Type = "express",
                    Capabilities = new AccountCapabilitiesOptions
                    {
                        CardPayments = new AccountCapabilitiesCardPaymentsOptions { Requested = true },
                        Transfers = new AccountCapabilitiesTransfersOptions { Requested = true },
                    },
                });

                accountId = account.Id;
                team.StripeAccountId = accountId;
                await _context.SaveChangesAsync();
            }
            
            var linkService = new AccountLinkService();
            var accountLink = await linkService.CreateAsync(new AccountLinkCreateOptions
            {
                Account = accountId,
                RefreshUrl = $"https://localhost:7045/StripeConnect/onboarding/refresh?TeamId={TeamId}",
                ReturnUrl = $"https://localhost:7045/StripeConnect/onboarding/complete?TeamId={TeamId}",
                Type = "account_onboarding",
            });

            return Ok(new { url = accountLink.Url });
        }
        
        [HttpGet("onboarding/complete")]
        public ContentResult OnboardingComplete()
        {
            return Content("Your account is ready to receive payments. You can close this window and return to the Developer Center.");
        }
        
        [HttpGet("onboarding/refresh")]
        public ContentResult OnboardingRefresh()
        {
            return Content("The setup process has expired. Return to the Developer Center and click 'Connect with Stripe' again.");
        }
        
        [Authorize]
        [TeamKey]
        [HttpGet("status")]
        public async Task<IActionResult> GetStripeStatus([FromQuery] Guid TeamId)
        {
            var team = await _context.ProgramersTeams.FirstOrDefaultAsync(t => t.TeamId == TeamId);
            if (team == null) return NotFound();

            if (string.IsNullOrEmpty(team.StripeAccountId))
                return Ok(new { connected = false, accountId = (string?)null });

            var accountService = new AccountService();
            var account = await accountService.GetAsync(team.StripeAccountId);

            var isActive = account.ChargesEnabled && account.PayoutsEnabled;
            return Ok(new { connected = isActive, accountId = team.StripeAccountId });
        }
    }
}
