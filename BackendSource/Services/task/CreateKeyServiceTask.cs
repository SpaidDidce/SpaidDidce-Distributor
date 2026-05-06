using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;

namespace BackendSource.Services.task
{
    public class CreateKeyServiceTask
    {
        public string errorMessage { get; set; }

        public bool IsSuccess { get; set; }

        public GamesKeys? Gamekey { get; set; }

        private CreateKeyServiceTask(bool success, string ErrorMessage, GamesKeys? gamesKeys)
        {
            Gamekey = gamesKeys;
            errorMessage = ErrorMessage;
            IsSuccess = success;
        }

        public static CreateKeyServiceTask OnSuccess(GamesKeys? gamesKeys)
            => new CreateKeyServiceTask(true, string.Empty, gamesKeys);

        public static CreateKeyServiceTask OnFailed(string ErrorMessage)
            => new CreateKeyServiceTask(false, ErrorMessage, null);
    }
}
