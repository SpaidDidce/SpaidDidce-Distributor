using BackendSource.DataBaseSystem;

namespace BackendSource.Services.task
{
    public class UserTask
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public UserTable? User { get; set; }

        public static UserTask Success(UserTable user) => new() { IsSuccess = true, User = user };
        public static UserTask Fail(string message) => new() { IsSuccess = false, ErrorMessage = message };
    }
}
