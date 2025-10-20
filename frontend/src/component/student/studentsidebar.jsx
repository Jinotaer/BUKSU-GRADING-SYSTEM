
import { useState } from "react";
import {
  IconSwitchHorizontal,
  IconLogout,
  IconX,
  IconTableDashed,
  IconUsersGroup,
  IconUsersPlus,
  IconUser,
  IconUserCircle,
  IconChevronDown,
  IconChevronRight,
  IconSchool,
  IconCalendarEvent,
  IconBook,
} from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../utils/auth";

import buksuLogo from "../../assets/logo1.png";

const menuData = [
  { 
    link: "/student", 
    label: "Dashboard", 
    icon: IconTableDashed,
    type: "single"
  },
  { 
    link: "/student/grades", 
    label: "My Grades", 
    icon: IconBook,
    type: "single"
  },
  { 
    link: "/student/subjects", 
    label: "My Subjects", 
    icon: IconSchool,
    type: "single"
  },
];

export function NavbarSimple() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for dropdown menus
  const [dropdownStates, setDropdownStates] = useState({
    "User Management": false,
    "Academic Management": false,
  });

  const [active, setActive] = useState(() => {
    // Find active item in flat structure
    const allItems = [];
    menuData.forEach(item => {
      if (item.type === "single") {
        allItems.push(item);
      } else if (item.type === "dropdown" && item.children) {
        allItems.push(...item.children);
      }
    });
    const found = allItems.find((item) => item.link === location.pathname);
    return found ? found.label : menuData[0].label;
  });

  const [collapsed] = useState(false);
  const [opened, setOpened] = useState(false); // for burger menu

  const toggleDropdown = (label) => {
    setDropdownStates(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleNav = (item) => {
    setActive(item.label);
    navigate(item.link);
    setOpened(false); // close sidebar when navigating (mobile)
  };

  const handleLogout = () => {
    logout();
  };

  const renderMenuItem = (item) => {
    if (item.type === "single") {
      return (
        <a
          key={item.label}
          className={`flex items-center gap-3 px-4 py-3 text-white/90 no-underline rounded-lg transition-all duration-150 text-sm cursor-pointer hover:bg-white/20 ${
            active === item.label ? 'bg-white/30 text-white font-semibold' : ''
          }`}
          href={item.link}
          onClick={(event) => {
            event.preventDefault();
            handleNav(item);
          }}
          aria-current={active === item.label ? "page" : undefined}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" stroke={1.5} />
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
        </a>
      );
    }

    if (item.type === "dropdown") {
      const isOpen = dropdownStates[item.label];
      return (
        <div key={item.label}>
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-white/90 rounded-lg transition-all duration-150 text-sm cursor-pointer hover:bg-white/20"
            onClick={() => toggleDropdown(item.label)}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 flex-shrink-0" stroke={1.5} />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
            </div>
            {isOpen ? (
              <IconChevronDown className="w-4 h-4 flex-shrink-0" stroke={1.5} />
            ) : (
              <IconChevronRight className="w-4 h-4 flex-shrink-0" stroke={1.5} />
            )}
          </button>
          
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => (
                <a
                  key={child.label}
                  className={`flex items-center gap-3 px-4 py-2 text-white/80 no-underline rounded-lg transition-all duration-150 text-sm cursor-pointer hover:bg-white/20 ${
                    active === child.label ? 'bg-white/30 text-white font-semibold' : ''
                  }`}
                  href={child.link}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNav(child);
                  }}
                  aria-current={active === child.label ? "page" : undefined}
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" stroke={1.5} />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{child.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const menuItems = menuData.map(renderMenuItem);

  return (
    <>
      {/* Burger button visible only on small screens */}
      {!opened && (
        <div className="hidden max-[880px]:block fixed top-3 left-3 z-[2001] rounded-md shadow-sm p-1" style={{ backgroundColor: '#091057' }}>
          <button
            onClick={() => setOpened(true)}
            aria-label="Open navigation"
            className="flex flex-col gap-1 p-2  rounded transition-colors cursor-pointer "
          >
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <nav
        className={`w-65 min-w-65 flex flex-col justify-between h-screen shadow-lg transition-all duration-200 overflow-hidden p-0 box-border fixed top-0 bottom-0 left-0 z-[1000] max-[880px]:transform max-[880px]:transition-transform max-[880px]:duration-300 max-[880px]:z-[2000] ${
          collapsed ? "w-16 min-w-16" : ""
        } ${
          opened ? "max-[880px]:translate-x-0" : "max-[880px]:-translate-x-full"
        }`}
        style={{ backgroundColor: '#152259' }}
        aria-label="Student sidebar"
      >
        <div>
          <div className="px-6 py-8 flex flex-col items-center justify-center border-b border-white/20" style={{ backgroundColor: '#152259' }}>
            <div className="flex flex-col items-center gap-4">
              <img src={buksuLogo} alt="BUKSU Logo"  className="h-20 w-20 object-cover rounded-half  shadow-sm" />
              {!collapsed && (
                <span className="font-bold text-xl text-white tracking-wide text-center">
                  STUDENT PANEL
                </span>
              )}
            </div>

            {/* Close button for overlay */}
            {opened ? (
              <button
                className="absolute top-4 right-4 p-2 rounded-md hover:bg-white/20 transition-colors"
                onClick={() => setOpened(false)}
                aria-label="Close sidebar"
              >
                <IconX stroke={1.5} className="w-5 h-5 text-white" />
              </button>
            ) : null}
          </div>

          <div className="p-4 flex flex-col gap-2">{menuItems}</div>
        </div>

        <div className="p-4 flex flex-col gap-2 border-t border-white/20">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-white/90 no-underline rounded-lg transition-all duration-150 text-sm cursor-pointer hover:bg-white/20"
            onClick={(event) => {
              event.preventDefault();
              navigate("/student/profile");
            }}
            title={!collapsed ? undefined : "Profile"}
          >
            <IconUserCircle className="w-5 h-5 flex-shrink-0" stroke={1.5} />
            {!collapsed && <span>Profile</span>}
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-white/90 no-underline rounded-lg transition-all duration-150 text-sm cursor-pointer hover:bg-white/20"
            onClick={(event) => {
              event.preventDefault();
              handleLogout();
            }}
            title={!collapsed ? undefined : "Logout"}
          >
            <IconLogout className="w-5 h-5 flex-shrink-0" stroke={1.5} />
            {!collapsed && <span>Logout</span>}
          </a>
        </div>
      </nav>

      {/* Overlay (for mobile UX) */}
      {opened && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-[1999]" 
          onClick={() => setOpened(false)} 
        />
      )}
    </>
  );
}
