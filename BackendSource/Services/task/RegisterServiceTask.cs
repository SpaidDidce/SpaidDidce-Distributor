using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class RegisterServiceTask
    {
        public UserTable? User { get; set; }

        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; }

        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }


        private RegisterServiceTask(bool success, UserTable? user, string errorMessage, string accessToken, string refreshToken)
        {
            User = user;
            IsSuccess = success;
            ErrorMessage = errorMessage;
            AccessToken = accessToken;
            RefreshToken = refreshToken;
        }

        public static RegisterServiceTask OnSuccess(UserTable user, string accessToken, string refreshToken)
            => new RegisterServiceTask(true, user, string.Empty, accessToken, refreshToken);

        public static RegisterServiceTask OnFailed(string ErrorMessage)
            => new RegisterServiceTask(false, null, ErrorMessage, string.Empty, string.Empty);
    }
}
