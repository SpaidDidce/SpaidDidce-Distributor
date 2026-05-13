using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Security
{
    public class GameKeyAttribute : TypeFilterAttribute
    {
        public GameKeyAttribute(string idParameterName = "id") : base(typeof(GameKeyFilter))
        {
            Arguments = new object[] { idParameterName };
        }
    }
}
