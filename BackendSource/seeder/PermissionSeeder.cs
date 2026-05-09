using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.Roles_Permissions;
using BackendSource.PermissionSystem;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.seeder
{
    public class PermissionSeeder
    {
        public static async Task seedAsync(DbContextBa context)
        {
            var permissionNames = typeof(PolicyNames)
                .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
                .Select(f => f.GetValue(null)!.ToString()!)
                .ToList();

            foreach (var permission in permissionNames)
            {
                var exist = await context.PermissionsTables.AnyAsync(p => p.Name == permission);

                if (!exist)
                {
                    context.PermissionsTables.Add(new PermissionsTable
                    {
                        Id = Guid.NewGuid(),
                        Name = permission,
                    });
                }

                await context.SaveChangesAsync();
            }
        }
    }
}
