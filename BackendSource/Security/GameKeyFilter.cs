using BackendSource.DataBaseSystem;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BackendSource.Security
{
    public class GameKeyFilter(DbContextBa dbContext, string idParameterName) : IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            if (!context.ActionArguments.TryGetValue(idParameterName, out var gameIdObj) || gameIdObj is not Guid gameId)
            {
                context.Result = new BadRequestObjectResult($"Valid '{idParameterName}' of type Guid is required.");
                return;
            }

            var hasLicense = await dbContext.Licences.AnyAsync(
                x => x.PlayerId == userId && x.GameId == gameId, 
                context.HttpContext.RequestAborted);

            if (!hasLicense)
            {
                context.Result = new ForbidResult();
                return;
            }

            await next();
        }
    }
}
