import { DateTime } from "luxon";
import pluginRss from "@11ty/eleventy-plugin-rss";

export default function(eleventyConfig) {

    eleventyConfig.addPlugin(pluginRss);

    // Passthrough: static assets
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy({ "Dubreuil services (1).png": "Dubreuil services (1).png" });
    eleventyConfig.addPassthroughCopy({ "logo3d.ico": "logo3d.ico" });
    eleventyConfig.addPassthroughCopy({ "hero_market_dark.png": "hero_market_dark.png" });

    // Collections — tous les articles triés par date décroissante
    eleventyConfig.addCollection("articles", col =>
        col.getFilteredByGlob("src/articles/*.md").sort((a, b) => b.date - a.date)
    );

    // Filtre date en français
    eleventyConfig.addFilter("dateFR", date =>
        DateTime.fromJSDate(date, { zone: "utc" }).setLocale("fr").toFormat("d LLLL yyyy")
    );

    // Filtre date ISO pour les balises SEO
    eleventyConfig.addFilter("dateISO", date =>
        DateTime.fromJSDate(date, { zone: "utc" }).toISO()
    );

    // Filtre: tronquer un texte
    eleventyConfig.addFilter("truncate", (str, n) =>
        str && str.length > n ? str.slice(0, n) + "…" : str
    );

    // Sitemap: dernière mise à jour
    eleventyConfig.addFilter("sitemapDate", date =>
        DateTime.fromJSDate(date, { zone: "utc" }).toFormat("yyyy-MM-dd")
    );

    // Reading time: 220 wpm (lecture FR moyenne pour texte dense)
    eleventyConfig.addFilter("readingTime", html => {
        if (!html) return 0;
        const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const words = text ? text.split(" ").length : 0;
        return Math.max(1, Math.ceil(words / 220));
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["njk", "md", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    };
};
