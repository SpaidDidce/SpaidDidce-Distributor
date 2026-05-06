using BackendSource.DataBaseSystem.GamesAndCodes;

namespace BackendSource.Services.task
{
    public class DeleteKeyServiceTaks
    {
        public string errorMessage { get; set; }

        public bool IsSuccess { get; set; }

        private DeleteKeyServiceTaks(bool success, string ErrorMessage)
        {
            errorMessage = ErrorMessage;
            IsSuccess = success;
        }

        public static DeleteKeyServiceTaks OnSuccess()
            => new DeleteKeyServiceTaks(true, string.Empty);

        public static DeleteKeyServiceTaks OnFailed(string ErrorMessage)
            => new DeleteKeyServiceTaks(false, ErrorMessage);
    }
}
