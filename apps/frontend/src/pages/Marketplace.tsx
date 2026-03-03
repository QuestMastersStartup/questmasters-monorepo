import { Search } from "lucide-react";

export function Marketplace() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold gold-gradient">
            Marketplace
          </h2>
          <p className="text-muted-foreground mt-1">
            Discover official and community content.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="marketplace-search"
            name="search"
            type="text"
            placeholder="Search packs..."
            className="w-full h-10 rounded-md border border-input bg-background/50 pl-10 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar Placeholder */}
        <div className="hidden lg:block space-y-6">
          <div className="card p-4 space-y-4 bg-card/30">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Systems
            </h3>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="system-5e-2024"
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id="system-5e-2024"
                  name="system-5e-2024"
                  type="checkbox"
                  checked
                  readOnly
                  className="rounded border-primary text-primary"
                />{" "}
                D&D 5e (2024)
              </label>
              <label
                htmlFor="system-5e-2014"
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id="system-5e-2014"
                  name="system-5e-2014"
                  type="checkbox"
                  className="rounded border-primary text-primary"
                />{" "}
                D&D 5e (2014)
              </label>
              <label
                htmlFor="system-pf2e"
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id="system-pf2e"
                  name="system-pf2e"
                  type="checkbox"
                  className="rounded border-primary text-primary"
                />{" "}
                Pathfinder 2e
              </label>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card p-12 border-dashed border-2 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[400px]">
            <p className="text-lg">Coming Soon</p>
            <p className="text-sm opacity-70">
              The global marketplace is under construction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
