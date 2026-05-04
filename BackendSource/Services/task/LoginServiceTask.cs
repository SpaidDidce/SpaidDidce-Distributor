using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class LoginServiceTask
    {

        public UserTable? User { get; set; }

        public bool IsSuccess { get; set; }

        private LoginServiceTask(bool success, UserTable? user)
        {
            User = user;
            IsSuccess = success;
        }

        public static LoginServiceTask OnSuccess(UserTable user) 
            => new LoginServiceTask(true, user);

        public static LoginServiceTask OnFailed() 
            => new LoginServiceTask(false, null);
    }
}
