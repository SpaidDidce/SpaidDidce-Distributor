namespace BackendSource.DataBaseSystem
{
    public class UserTable
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public Guid RoleId { get; set; }
        public RoleTable Role { get; set; } = null!;

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset DeletedAt { get; set; }
        public bool IsDeleted { get; set; }
        public bool ItsBanned { get; set; }
        public string HashedPassword { get; set; } = string.Empty;
    }
}
