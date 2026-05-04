using Microsoft.AspNetCore.Authorization;

namespace BackendSource.PermissionSystem
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            var permission = context.User.FindAll("permission").Select(c => c.Value);

            if (permission.Contains(requirement.Permission) || permission.Contains("*"))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
