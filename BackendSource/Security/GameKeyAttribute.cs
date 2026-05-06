using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.Security
{
    public class GameKeyAttribute : Attribute, IAsyncActionFilter
    {
        private const string UserKey = "X-Api-Key";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            /*
            var request = context.HttpContext.Request;

            if (!request.Headers.TryGetValue(ApiKeyHeader, out var extractedApiKey) ||
                !request.Headers.TryGetValue(ServerIdHeader, out var extractedServerId))
            {
                context.Result = new ContentResult()
                {
                    StatusCode = 401,
                    Content = "Faltan encabezados de autenticación"
                };
                return;
            }

            var db = context.HttpContext.RequestServices.GetRequiredService<DDbContext>();

            var server = await db.Servers
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.ServerId == extractedServerId.ToString()
                                       && s.ApiKey == extractedApiKey.ToString());

            if (server == null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            context.HttpContext.Items["CurrentServer"] = server;

            await next();
            */
        }
    }
}
