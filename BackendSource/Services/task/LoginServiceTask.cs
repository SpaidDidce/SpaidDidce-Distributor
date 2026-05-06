using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class LoginServiceTask
    {

        public bool IsSuccess { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }

        private LoginServiceTask(bool success, string accessToken, string refreshToken)
        {
            IsSuccess = success;
            AccessToken = accessToken;
            RefreshToken = refreshToken;
        }

        public static LoginServiceTask OnSuccess(string accessToken, string refreshToken) 
            => new LoginServiceTask(true, accessToken, refreshToken);

        public static LoginServiceTask OnFailed()
            => new LoginServiceTask(false, string.Empty, string.Empty);
    }
}
