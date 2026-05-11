using BackendSource.RTH;
using BackendSource.Services.APIServices;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class RefreshController(IRefreshTokenService refreshService, IAuthService authService, IJwtService jwtService) : Controller
    {
        private readonly IRefreshTokenService _refreshTokenService = refreshService;
        private readonly IAuthService _authService = authService;
        private readonly IJwtService _jwtService = jwtService;

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> refreshtoken()
        {
            if (!Request.Headers.TryGetValue("refresh_token", out var refreshToken))
                return Ok();

            var test = RefreshTokenHasher.Hash(refreshToken!);

            var oldRefreshToken = await _refreshTokenService.GetRefreshTokenFromDB(test);
            if (oldRefreshToken == null || oldRefreshToken.token == null)
                return Unauthorized();

            var newRefreshToken = await _refreshTokenService.RevokeAndGenerateNew(oldRefreshToken.token!.TokenHash);
            var user = await _authService.GetUser(oldRefreshToken.token.UserId);
            var jwtResult = _jwtService.GenerateAccessToken(user.User!);

            return Ok(new 
            {
                accessToken = jwtResult.Token,
                refreshToken = newRefreshToken,
            });
        }

    }
}
