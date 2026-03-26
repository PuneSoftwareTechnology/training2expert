import { Building2, ExternalLink, ShieldCheck, MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const institutes = [
  {
    abbr: "PST",
    name: "Pune Software Technologies",
    logo: "https://www.punesoftwaretechnologies.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FLogo.a02dd24f.png&w=64&q=75",
    gradient: "from-blue-500 to-indigo-600",
    bgTint: "bg-blue-50",
    links: [
      { label: "Website", url: "https://www.punesoftwaretechnologies.com/", icon: ExternalLink, color: "text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200" },
      { label: "Admin Panel", url: "https://admin-panel-iota-roan.vercel.app/home/courses", icon: ShieldCheck, color: "text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
      { label: "Testimonials", url: "https://www.punesoftwaretechnologies.com/testimonial", icon: MessageSquareQuote, color: "text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border-purple-200" },
    ],
  },
  {
    abbr: "TCH",
    name: "Tech Concept Hub",
    logo: "https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F2662376%2Fe53bb90e-9bba-4bd7-af12-a7cbc862e9d6.png",
    gradient: "from-orange-500 to-red-500",
    bgTint: "bg-orange-50",
    links: [
      { label: "Website", url: "https://techconcepthub.com/", icon: ExternalLink, color: "text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border-orange-200" },
    ],
  },
];

export function InstituteSection() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 w-fit">
        <Building2 className="h-4 w-4" />
        Institute Details
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {institutes.map((inst) => (
          <Card key={inst.abbr} className="overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${inst.gradient}`} />
            <CardContent className="flex items-start gap-3 pt-3">
              <img
                src={inst.logo}
                alt={`${inst.abbr} logo`}
                className="h-11 w-11 rounded-lg object-contain bg-white p-1 shadow-sm border"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-bold">{inst.abbr}</p>
                  <p className="text-xs text-muted-foreground truncate">{inst.name}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {inst.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all underline-offset-2 hover:underline ${link.color}`}
                    >
                      <link.icon className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
