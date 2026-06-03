import { Link } from "react-router-dom";
import { MapPin, Mail, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-white text-xl font-bold tracking-tight">
              Common Grounds
            </span>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Helping people in the Greater Seattle Area find local spaces, community events, and connections
              that help make this city feel like home.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Heart size={12} className="text-green-500" aria-hidden="true" />
              <span>Community-centered, not profit-driven</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white text-sm font-semibold uppercase tracking-wide">
              Explore
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="flex flex-col gap-2 list-none">
                <li>
                  <Link
                    to="/"
                    className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/neighborhoods"
                    className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    Neighborhoods
                  </Link>
                </li>
                <li>
                  <Link
                    to="/events"
                    className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    Browse Events
                  </Link>
                </li>
              </ul>
            </nav>

            <h3 className="text-white text-sm font-semibold uppercase tracking-wide mt-4">
              About
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              INFO 2026 Capstone Project
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white text-sm font-semibold uppercase tracking-wide">
              Contact
            </h3>
            <ul className="flex flex-col gap-3 list-none">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Mail
                  size={15}
                  className="mt-0.5 shrink-0 text-green-500"
                  aria-hidden="true"
                />
                <span>
                  <span className="block text-gray-300 font-medium">
                    General Inquiries
                  </span>
                  nathankomi13@gmail.com
                </span>
              </li>
              
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-green-500"
                  aria-hidden="true"
                />
                <span>
                  <span className="block text-gray-300 font-medium">
                    Based in
                  </span>
                  Seattle, WA - serving the Greater Seattle Area
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© 2026 Common Grounds.</span>
        </div>
      </div>
    </footer>
  );
}
