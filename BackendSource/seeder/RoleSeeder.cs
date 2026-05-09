using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.Roles_Permissions;
using BackendSource.PermissionSystem;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.seeder
{
    public class RoleSeeder
    {
        public static async Task SeedAsync(DbContextBa context)
        {
            var userExist = await context.RoleTables.AnyAsync(p => p.RoleName == "User");
            if (userExist) return;

            // Obtener los permisos que quieres asignar a "User"
            var selectedPermissions = new List<string>
            {
                PolicyNames.VerifyGame,
            };


            // Traer los objetos PermissionsTable que correspondan a esos nombres
            var permissionsFromDb = await context.PermissionsTables
                .Where(p => selectedPermissions.Contains(p.Name))
                .ToListAsync();


            // Crear el rol
            var userRole = new RoleTable
            {
                RoleName = "User",
                RolePermissions = permissionsFromDb.Select(p => new RolePermissionTable
                {
                    Id = Guid.NewGuid(),
                    PermissionId = p.Id
                }).ToList()
            };

            // Agregar el rol a la base de datos
            context.RoleTables.Add(userRole);
            await context.SaveChangesAsync();
        }
    }
}
