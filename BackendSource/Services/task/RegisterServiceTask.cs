using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class RegisterServiceTask
    {
        public UserTable? User { get; set; }

        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; }

        private RegisterServiceTask(bool success, UserTable? user, string errorMessage)
        {
            User = user;
            IsSuccess = success;
            ErrorMessage = errorMessage;
        }

        public static RegisterServiceTask OnSuccess(UserTable user)
            => new RegisterServiceTask(true, user, string.Empty);

        public static RegisterServiceTask OnFailed(string ErrorMessage)
            => new RegisterServiceTask(false, null, ErrorMessage);
    }
}
