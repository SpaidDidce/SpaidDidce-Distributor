using BackendSource.Security;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MeController(IMeService meService) : Controller
    {
        private readonly IMeService _meService = meService;
        
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyLibrary()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null) return Unauthorized();

            Guid userId = Guid.Parse(userIdClaim);

            var result = await _meService.GetLibrary(userId);

            if (!result.IsSuccess)
            {
                return Unauthorized();
            }

            return Ok(result.Games);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> BuyGame([FromBody] Guid gameId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null) return Unauthorized();

            Guid userId = Guid.Parse(userIdClaim);

            var result = await _meService.BuyGame(userId, gameId);

            if (!result)
            {
                return Unauthorized();
            }

            return Ok(result);
        }

        [Authorize]
        [HttpGet("getifgameihaveit")]
        public async Task<IActionResult> GetIfGameIHaveit(Guid GameId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null) return Unauthorized();

            Guid userId = Guid.Parse(userIdClaim);

            var result = await _meService.GetIfGameIHaveit(userId, GameId);

            if (!result)
            {
                return Unauthorized();
            }

            return Ok(result);
        }
    }
}
