const axios = require('../../utils/axios');
const cheerio = require('cheerio');
const utils = require('./utils');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (ctx) => {
    let feed, title, link;

    if (ctx.params.channel) {
        let channel = ctx.params.channel.toLowerCase();
        channel = channel.split('-').join('/');

        if (channel === 'chinese') {
            feed = await parser.parseURL('https//feeds.bbci.co.uk/zhongwen/simp/rss.xml');
            title = 'BBC News 中文网';
            link = 'https://www.bbc.com/zhongwen/simp';
        } else {
            try {
                feed = await parser.parseURL(`https://feeds.bbci.co.uk/news/${channel}/rss.xml`);
                title = `BBC News ${channel}`;
                link = `https://www.bbc.co.uk/news/${channel}`;
            } catch (error) {
                ctx.state.data = {
                    title: `BBC News ${channel} doesn't exist`,
                    description: `BBC News ${channel} doesn't exist`,
                };
                return;
            }
        }
    } else {
        feed = await parser.parseURL('https://feeds.bbci.co.uk/news/rss.xml');
        title = 'BBC News Top Stories';
        link = 'https://www.bbc.co.uk/news';
    }

    const items = await Promise.all(
        feed.items.splice(0, 10).map(async (item) => {
            const response = await axios({
                method: 'get',
                url: item.link,
            });

            const $ = cheerio.load(response.data);

            const description = utils.ProcessFeed($, item.link).html();

            const single = {
                title: item.title,
                description,
                pubDate: item.pubDate,
                link: item.link,
            };
            return Promise.resolve(single);
        })
    );

    ctx.state.data = {
        title,
        link,
        description: title,
        item: items,
    };
};
