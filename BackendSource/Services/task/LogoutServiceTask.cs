using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class LogoutServiceTask
    {
        public string Message { get; set; } = string.Empty;

        public bool IsSuccess { get; set; }

        private LogoutServiceTask(bool success, string message)
        {
            IsSuccess = success;
            Message = message;
        }

        public static LogoutServiceTask OnSuccess(string SuccessMessage)
            => new LogoutServiceTask(true, SuccessMessage);

        public static LogoutServiceTask OnFailed(string ErrorMessage)
            => new LogoutServiceTask(false, ErrorMessage);
    }
}
