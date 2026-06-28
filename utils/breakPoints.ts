import { useMediaQuery } from "react-responsive";

const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

export const useBreakpoints = () => {
  const isXs = useMediaQuery({ maxWidth: breakpoints.xs - 1 });
  const isSm = useMediaQuery({
    minWidth: breakpoints.xs,
    maxWidth: breakpoints.sm - 1,
  });
  const isMd = useMediaQuery({
    minWidth: breakpoints.sm,
    maxWidth: breakpoints.md - 1,
  });
  const isLg = useMediaQuery({
    minWidth: breakpoints.md,
    maxWidth: breakpoints.lg - 1,
  });
  const isXl = useMediaQuery({
    minWidth: breakpoints.lg,
    maxWidth: breakpoints.xl - 1,
  });
  const isXxl = useMediaQuery({ minWidth: breakpoints.xl });

  const isMobile = useMediaQuery({ maxWidth: breakpoints.md - 1 });
  const isTablet = useMediaQuery({
    minWidth: breakpoints.md,
    maxWidth: breakpoints.lg - 1,
  });
  const isDesktop = useMediaQuery({ minWidth: breakpoints.lg });

  const isSmAndUp = useMediaQuery({ minWidth: breakpoints.xs });
  const isMdAndUp = useMediaQuery({ minWidth: breakpoints.sm });
  const isLgAndUp = useMediaQuery({ minWidth: breakpoints.md });
  const isXlAndUp = useMediaQuery({ minWidth: breakpoints.lg });
  const isXxlAndUp = useMediaQuery({ minWidth: breakpoints.xl });

  const isSmAndDown = useMediaQuery({ maxWidth: breakpoints.sm - 1 });
  const isMdAndDown = useMediaQuery({ maxWidth: breakpoints.md - 1 });
  const isLgAndDown = useMediaQuery({ maxWidth: breakpoints.lg - 1 });
  const isXlAndDown = useMediaQuery({ maxWidth: breakpoints.xl - 1 });

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isDesktop,
    isSmAndUp,
    isMdAndUp,
    isLgAndUp,
    isXlAndUp,
    isXxlAndUp,
    isSmAndDown,
    isMdAndDown,
    isLgAndDown,
    isXlAndDown,
  };
};
