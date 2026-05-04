using BackendSource.DataBaseSystem.JwtAndRefreshTokens;
using BackendSource.DTOs;
using BackendSource.Services.task;

namespace BackendSource.Services.APIServices
{
    public interface IAuthService
    {
        public Task<LoginServiceTask> Login(LoginDto dto);
        public Task<RefreshToken> Logout(string refreshToken);
        public Task<RegisterServiceTask> Register(RegisterDto dto);
    }
}
