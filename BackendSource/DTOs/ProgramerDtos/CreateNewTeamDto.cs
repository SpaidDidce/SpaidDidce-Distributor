using BackendSource.DataBaseSystem;

namespace BackendSource.DTOs.ProgramerDtos
{
    public class CreateNewTeamDto
    {
        public string TeamName { get; set; } = string.Empty;
        public UserTable? Owner { get; set; }
    }
}
