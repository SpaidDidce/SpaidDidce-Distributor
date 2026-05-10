using BackendSource.DataBaseSystem.JwtAndRefreshTokens;

namespace BackendSource.Services.task
{
    public class RefreshTokenResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public RefreshToken? token { get; set; }

        public static RefreshTokenResult Success(RefreshToken tokenResult) => new() { IsSuccess = true, token = tokenResult };
        public static RefreshTokenResult Fail(string message) => new() { IsSuccess = false, ErrorMessage = message };
    }
}
