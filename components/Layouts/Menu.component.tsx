"use client";

import { useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";

interface MenuComponentProps {
  isOpen: boolean;
  onCloseComplete: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  subItems?: {
    id: string;
    label: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    id: "artwork-filter",
    label: "Filter ArtWork by",
    subItems: [
      {
        id: "digital-painting",
        label: "Digital Painting",
      },
      {
        id: "traditional-artwork",
        label: "Traditional ArtWork",
      },
      {
        id: "graphic-design",
        label: "Graphic Design",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
  },
  {
    id: "statement",
    label: "Statement",
  },
];

interface MenuItemComponentProps {
  item: MenuItem;
}

const MenuItemComponent = ({ item }: MenuItemComponentProps) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const submenuRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  const hasSubmenu = Boolean(item.subItems?.length);

  useGSAP(
    () => {
      const submenuElement = submenuRef.current;

      if (!submenuElement) {
        return;
      }

      const submenuItems = gsap.utils.toArray<HTMLElement>(
        "[data-submenu-item]",
        submenuElement,
      );

      gsap.killTweensOf([submenuElement, ...submenuItems]);

      if (isInitialRender.current) {
        gsap.set(submenuElement, {
          display: "none",
          height: 0,
        });

        gsap.set(submenuItems, {
          autoAlpha: 0,
          y: -8,
        });

        isInitialRender.current = false;

        return;
      }

      if (isSubmenuOpen) {
        gsap
          .timeline()
          .set(submenuElement, {
            display: "block",
          })
          .to(submenuElement, {
            height: "auto",

            duration: 0.35,
            ease: "power2.inOut",
          })
          .to(
            submenuItems,
            {
              autoAlpha: 1,
              y: 0,

              duration: 0.25,
              stagger: 0.05,
              ease: "power2.out",
            },
            "-=0.15",
          );

        return;
      }

      gsap
        .timeline()
        .to(submenuItems, {
          autoAlpha: 0,
          y: -6,

          duration: 0.15,
          stagger: {
            each: 0.03,
            from: "end",
          },
          ease: "power2.in",
        })
        .to(
          submenuElement,
          {
            height: 0,

            duration: 0.3,
            ease: "power2.inOut",
          },
          "-=0.05",
        )
        .set(submenuElement, {
          display: "none",
        });
    },
    {
      dependencies: [isSubmenuOpen],
      scope: submenuRef,
    },
  );

  const handleItemClick = () => {
    if (!hasSubmenu) {
      return;
    }

    setIsSubmenuOpen((current) => !current);
  };

  return (
    <div>
      <button
        data-menu-item
        type="button"
        aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
        aria-controls={hasSubmenu ? `${item.id}-submenu` : undefined}
        onClick={handleItemClick}
        className="
          w-full
          cursor-pointer
          bg-transparent
          px-4
          py-4
          text-center
          text-xs
          font-semibold
          transition-colors
          hover:bg-black/5
          sm:px-5
          sm:py-5
          sm:text-sm
        "
      >
        {item.label}
      </button>

      {hasSubmenu && (
        <div
          ref={submenuRef}
          id={`${item.id}-submenu`}
          className="
            hidden
            h-0
            overflow-hidden
            bg-neutral-300/65
          "
        >
          <div className="flex flex-col py-2 sm:py-3">
            {item.subItems?.map((subItem) => (
              <button
                key={subItem.id}
                data-submenu-item
                type="button"
                className="
                  w-full
                  cursor-pointer
                  bg-transparent
                  px-4
                  py-2.5
                  text-center
                  text-xs
                  font-semibold
                  transition-colors
                  hover:bg-black/5
                  sm:px-5
                  sm:py-3
                  sm:text-sm
                "
              >
                {subItem.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MenuComponent = ({
  isOpen,
  onCloseComplete,
}: MenuComponentProps) => {
  const menuRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const menuElement = menuRef.current;

      if (!menuElement) {
        return;
      }

      const topLevelItems = gsap.utils.toArray<HTMLElement>(
        "[data-menu-item]",
        menuElement,
      );

      gsap.killTweensOf([menuElement, ...topLevelItems]);

      if (isOpen) {
        gsap.set(menuElement, {
          pointerEvents: "auto",
        });

        gsap
          .timeline()
          .fromTo(
            menuElement,
            {
              autoAlpha: 0,
              scale: 0.94,
              y: -12,
            },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,

              duration: 0.35,
              ease: "power3.out",
              transformOrigin: "top right",
            },
          )
          .fromTo(
            topLevelItems,
            {
              autoAlpha: 0,
              y: -8,
            },
            {
              autoAlpha: 1,
              y: 0,

              duration: 0.25,
              stagger: 0.05,
              ease: "power2.out",
            },
            "-=0.15",
          );

        return;
      }

      gsap
        .timeline({
          onComplete: onCloseComplete,
        })
        .to(topLevelItems, {
          autoAlpha: 0,
          y: -6,

          duration: 0.15,
          stagger: {
            each: 0.03,
            from: "end",
          },
          ease: "power2.in",
        })
        .to(
          menuElement,
          {
            autoAlpha: 0,
            scale: 0.94,
            y: -12,

            duration: 0.25,
            ease: "power3.in",
            transformOrigin: "top right",
          },
          "-=0.05",
        )
        .set(menuElement, {
          pointerEvents: "none",
        });
    },
    {
      dependencies: [isOpen, onCloseComplete],
      scope: menuRef,
    },
  );

  return (
    <nav
      ref={menuRef}
      id="main-navigation-menu"
      aria-label="Main navigation"
      className="
        invisible
        absolute
        right-3
        top-14
        z-30
        max-h-[calc(100dvh-4.5rem)]
        w-[calc(100vw-1.5rem)]
        max-w-72
        overflow-hidden
        overflow-y-auto
        rounded-2xl
        border
        border-black/85
        bg-white/80
        opacity-0
        shadow-xl
        shadow-black/10
        backdrop-blur-md
        sm:right-6
        sm:top-16
        sm:w-64
        sm:border-2
      "
    >
      {menuItems.map((item) => (
        <MenuItemComponent key={item.id} item={item} />
      ))}
    </nav>
  );
};
