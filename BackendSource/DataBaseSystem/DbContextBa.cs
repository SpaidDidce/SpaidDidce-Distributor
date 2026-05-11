using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.JwtAndRefreshTokens;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DataBaseSystem.Roles_Permissions;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.DataBaseSystem
{
    public class DbContextBa : DbContext
    {
        public DbContextBa(DbContextOptions<DbContextBa> options) : base(options) { }

        public DbSet<UserTable> Users { get; set; }

        public DbSet<RolePermissionTable> RolePermissions { get; set; }
        public DbSet<RoleTable> RoleTables { get; set; }
        public DbSet<PermissionsTable> PermissionsTables { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        // Games
        public DbSet<GamesTable> Games { get; set; }
        public DbSet<GameVersionTable> GameVersions { get; set; }
        public DbSet<LicencesTable> Licences { get; set; }
        public DbSet<GamesKeys> GamesKeys { get; set; }
        // Games

        // Developer
        public DbSet<TeamProgramingDatabse> ProgramersTeams { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserTable>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<UserTable>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            modelBuilder.Entity<RolePermissionTable>()
                .HasKey(rp => new { rp.RoleId, rp.PermissionId });

            modelBuilder.Entity<RolePermissionTable>()
                .HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId);

            modelBuilder.Entity<RolePermissionTable>()
                .HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId);

            modelBuilder.Entity<LicencesTable>()
                .HasIndex(x => new { x.GameId, x.PlayerId })
                .IsUnique();

            modelBuilder.Entity<TeamProgramingDatabse>()
                .HasIndex(x => x.TeamId)
                .IsUnique();
        }
    }
}
