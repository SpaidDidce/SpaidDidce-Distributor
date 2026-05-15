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

        /// <summary>
        /// Genera el link de onboarding de Stripe para que el equipo conecte su cuenta.
        /// El desarrollador debe ser el dueño del equipo (OwnerId).
        /// </summary>
        [Authorize]
        [TeamKey]
        [HttpPost("onboarding")]
        public async Task<IActionResult> CreateOnboardingLink([FromQuery] Guid TeamId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var team = await _context.ProgramersTeams.FirstOrDefaultAsync(t => t.TeamId == TeamId);
            if (team == null) return NotFound("Equipo no encontrado.");
            if (team.OwnerId != Guid.Parse(userIdClaim)) return Forbid();

            string accountId;

            // Si el equipo ya tiene una cuenta de Stripe, reutilizarla
            if (!string.IsNullOrEmpty(team.StripeAccountId))
            {
                accountId = team.StripeAccountId;
            }
            else
            {
                // Crear una nueva cuenta Express de Stripe para el equipo
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

            // Crear el link de onboarding para que el equipo complete su perfil de Stripe
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

        /// <summary>
        /// Página de retorno cuando el equipo completa el onboarding.
        /// </summary>
        [HttpGet("onboarding/complete")]
        public ContentResult OnboardingComplete([FromQuery] Guid TeamId)
        {
            return Content(
                "<html><body style='font-family:sans-serif;text-align:center;padding:50px'>" +
                "<h1>? ¡Cuenta de Stripe conectada!</h1>" +
                "<p>Tu cuenta está lista para recibir pagos. Puedes cerrar esta ventana y volver al Developer Center.</p>" +
                "</body></html>", "text/html");
        }

        /// <summary>
        /// Página de reintento si el onboarding falla o expira.
        /// </summary>
        [HttpGet("onboarding/refresh")]
        public ContentResult OnboardingRefresh([FromQuery] Guid TeamId)
        {
            return Content(
                "<html><body style='font-family:sans-serif;text-align:center;padding:50px'>" +
                "<h1>?? El link expiró</h1>" +
                "<p>El proceso de configuración expiró. Vuelve al Developer Center y haz clic en 'Conectar con Stripe' de nuevo.</p>" +
                "</body></html>", "text/html");
        }

        /// <summary>
        /// Comprueba si el equipo ya tiene una cuenta de Stripe conectada y activa.
        /// </summary>
        [Authorize]
        [TeamKey]
        [HttpGet("status")]
        public async Task<IActionResult> GetStripeStatus([FromQuery] Guid TeamId)
        {
            var team = await _context.ProgramersTeams.FirstOrDefaultAsync(t => t.TeamId == TeamId);
            if (team == null) return NotFound();

            if (string.IsNullOrEmpty(team.StripeAccountId))
                return Ok(new { connected = false, accountId = (string?)null });

            // Verificar con Stripe que la cuenta esté activa y tenga los permisos necesarios
            var accountService = new AccountService();
            var account = await accountService.GetAsync(team.StripeAccountId);

            var isActive = account.ChargesEnabled && account.PayoutsEnabled;
            return Ok(new { connected = isActive, accountId = team.StripeAccountId });
        }
    }
}
