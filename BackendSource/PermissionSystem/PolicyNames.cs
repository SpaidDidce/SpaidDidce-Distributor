namespace BackendSource.PermissionSystem
{
    public class PolicyNames
    {
        public const string All = "*";
        public const string Tester = "Tester";

        public const string ChangeGameVersion = "CGV";
        public const string putNewGameVersions = "pNGV";

        public const string VerifyGame = "VG";

        public static string[] all =
        {
            VerifyGame, ChangeGameVersion, putNewGameVersions, All, Tester,
        };
    }
}
