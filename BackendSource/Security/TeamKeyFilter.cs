using BackendSource.DataBaseSystem;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BackendSource.Security
{
    public class TeamKeyFilter(DbContextBa dbContext, string idParameterName, bool onlyOwner) : IAsyncActionFilter
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

            var hasAccess = await dbContext.ProgramersTeams.AnyAsync(
                x => x.GameId != null && x.GameId.Contains(gameId) && 
                     (x.OwnerId == userId || (!onlyOwner && x.UsersInTeam != null && x.UsersInTeam.Any(u => u.Id == userId))),
                context.HttpContext.RequestAborted);

            if (!hasAccess)
            {
                context.Result = new ForbidResult();
                return;
            }

            await next();
        }
    }
}
