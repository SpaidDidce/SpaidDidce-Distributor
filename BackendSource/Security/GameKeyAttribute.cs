using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Security
{
    public class GameKeyAttribute : TypeFilterAttribute
    {
        /// <summary>
        /// Initializes a new instance of the GameKeyAttribute.
        /// </summary>
        /// <param name="idParameterName">The name of the action parameter that contains the game ID. Defaults to "id".</param>
        public GameKeyAttribute(string idParameterName = "id") : base(typeof(GameKeyFilter))
        {
            Arguments = new object[] { idParameterName };
        }
    }
}
