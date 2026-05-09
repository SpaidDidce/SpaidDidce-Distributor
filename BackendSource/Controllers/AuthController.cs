using BackendSource.Services.APIServices;
using BackendSource.Services.CompleteServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController(IAuthService authService) : Controller
    {
        private readonly IAuthService _authService = authService;


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] DTOs.RegisterDto dto)
        {
            var result = await _authService.Register(dto);
            if (!result.IsSuccess)
            {
                return BadRequest(result.ErrorMessage);
            }

            return Ok(new
            {
                accessToken = result.AccessToken,
                refreshToken = result.RefreshToken,
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> login([FromBody] DTOs.LoginDto dto)
        {
            var result = await _authService.Login(dto);
            if (!result.IsSuccess)
            {
                return BadRequest("Something is wrong");
            }

            return Ok(new
            {
                accessToken = result.AccessToken,
                refreshToken = result.RefreshToken,
            });
        }

        [Authorize]
        [HttpGet("logout")]
        public async Task<IActionResult> logout()
        {
            if (!Request.Headers.TryGetValue("refresh_token", out var refreshtoken))
                return Ok();

            var result = await _authService.Logout(refreshtoken);

            if (result == null)
                return Conflict("Something is wrong");

            return Ok($"Godbye");
        }

    }
}
