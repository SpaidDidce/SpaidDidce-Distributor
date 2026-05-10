using BackendSource.DataBaseSystem;
using BackendSource.Services.task;

namespace BackendSource.Services.Interfaces
{
    public interface IRefreshTokenService
    {
        Task<string> RefreshToken(UserTable user);
        Task<RefreshNewTokenResult> NewToken(string refreshToken);
        Task<RefreshTokenResult> GetRefreshTokenFromDB(string refreshTokenHashed);
        Task<string> RevokeAndGenerateNew(string oldRefreshTokenFromClient);
    }
}
