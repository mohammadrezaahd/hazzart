import type { PortfolioData, Artwork, PaintingCategory, Project } from "@/interfaces/Portfolio";
import { getCategories } from "@/lib/categories";
import { getArtistContent, getArtistSocialPlatforms } from "@/lib/artist";
import { getPaintings } from "@/lib/paintings";
import { getProjects } from "@/lib/projects";
import { getTableItems } from "@/lib/table";

const ARTIST_NAME = "Ghazal Shafiei";

function toCategories(categories: Awaited<ReturnType<typeof getCategories>>): PaintingCategory[] {
  const topLevel = categories.filter((category) => category.parentId === null);
  return topLevel.map((category) => ({
    id: category.id,
    label: category.name,
    children: categories
      .filter((child) => child.parentId === category.id)
      .map((child) => ({ id: child.id, label: child.name })),
  }));
}

function toArtworks(
  paintings: Awaited<ReturnType<typeof getPaintings>>["paintings"],
): Artwork[] {
  return paintings.map((painting, index) => {
    const primary = painting.images[0];
    const hover = painting.images[1];
    const aspectRatio = 0.75;
    const rotation = [0, -8, 10, -12, 7, -6][index % 6];

    return {
      id: painting.id,
      title: painting.name,
      year: Number(painting.completedDate.slice(0, 4)) || 0,
      createdAt: painting.createdAt,
      description: painting.description,
      mediumId: painting.categoryIds[0] ?? "",
      paintingCategoryIds: painting.categoryIds,
      image: {
        src: primary.url,
        alt: primary.name,
        width: 1,
        height: 1,
      },
      hoverImage: {
        src: hover.url,
        alt: hover.name,
        width: 1,
        height: 1,
      },
      dimensions: "",
      table: {
        rotation,
        aspectRatio,
      },
    };
  });
}

function toProjects(
  projects: Awaited<ReturnType<typeof getProjects>>,
): Project[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.title,
    tagline: "",
    description: "",
    year: Number(project.started.slice(0, 4)) || 0,
    discipline: "",
    client: "",
    myRole: project.myRole ? [project.myRole] : [],
    images: project.images.map((image) => ({
      src: image.url,
      alt: image.name,
      width: 1,
      height: 1,
      aspectRatio: 0.75,
      caption: image.name,
    })),
    links: project.links.map((link) => ({
      id: link.id,
      label: link.title,
      href: link.link,
    })),
    dynamicFields: {
      ...project.dynamicFields,
      Started: project.started,
      ...(project.ended ? { Ended: project.ended } : {}),
    },
  }));
}

export async function getPublicPortfolio(): Promise<PortfolioData & {
  contact: string;
  cv: string;
  socials: Array<{ id: string; name: string; url: string; iconSvg: string }>;
}> {
  const [artist, categories, paintingsResult, projects, platforms, tableItems] = await Promise.all([
    getArtistContent(),
    getCategories(),
    getPaintings({}),
    getProjects(),
    getArtistSocialPlatforms(),
    getTableItems(),
  ]);

  const platformMap = new Map(platforms.map((platform) => [platform.id, platform]));

  return {
    artist: {
      name: ARTIST_NAME,
      description: artist.cvText || artist.contactText,
    },
    artworks: toArtworks(paintingsResult.paintings.filter((painting) => painting.status === "published")),
    tableArtworks: toArtworks(tableItems.map((item) => ({
      id: item.paintingId,
      name: item.title,
      description: item.description,
      completedDate: item.completedDate,
      categoryIds: item.categoryIds,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: "published" as const,
      images: [{
        fileId: item.imageFileId,
        url: item.imageUrl,
        name: item.imageName,
        contentType: "image/*",
        size: 0,
        starred: true,
      }, {
        fileId: item.imageFileId + ":hover",
        url: item.imageUrl,
        name: item.imageName,
        contentType: "image/*",
        size: 0,
        starred: true,
      }],
    }))),
    projects: toProjects(projects.filter((project) => project.status === "published")),
    mediums: categories
      .filter((category) => category.parentId === null)
      .map((category) => ({ id: category.id, label: category.name })),
    paintingCategories: toCategories(categories),
    contact: artist.contactText,
    cv: artist.cvText,
    socials: artist.socials
      .map((social) => {
        const platform = platformMap.get(social.platformId);
        if (!platform) return null;
        return {
          id: platform.id,
          name: platform.name,
          url: social.url,
          iconSvg: platform.iconSvg,
        };
      })
      .filter((social): social is { id: string; name: string; url: string; iconSvg: string } => Boolean(social)),
  };
}
