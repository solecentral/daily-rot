"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueEmail = IssueEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
function IssueEmail({ issue, unsubscribeUrl = '#' }) {
    const { content, issueNumber, subject } = issue;
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, {}), (0, jsx_runtime_1.jsxs)(components_1.Preview, { children: [subject, " \u2014 Your daily dose of brain rot \uD83D\uDD25"] }), (0, jsx_runtime_1.jsxs)(components_1.Body, { style: main, children: [(0, jsx_runtime_1.jsxs)(components_1.Section, { style: header, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: logo, children: "THE DAILY ROT" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: issueTag, children: ["ISSUE #", issueNumber] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: tagline, children: "Your daily dose of brain rot, delivered." })] }), (0, jsx_runtime_1.jsxs)(components_1.Container, { style: container, children: [(0, jsx_runtime_1.jsxs)(components_1.Section, { style: card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: cardHeader, children: "\uD83D\uDD25 THE ROT REPORT" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: cardSubtitle, children: "Top 3 brain rot moments from the internet" }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: divider }), content.rotReport.map((item, i) => ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: rotItem, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { style: rotTitle, children: [i + 1, ". ", item.title] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: rotDesc, children: item.description })] }, i)))] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: cardHeader, children: "\uD83D\uDC38 MEME OF THE DAY" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: cardSubtitle, children: "One certified banger" }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: divider }), content.memeOfTheDay.imageUrl && ((0, jsx_runtime_1.jsx)(components_1.Img, { src: content.memeOfTheDay.imageUrl, alt: "Meme of the Day", style: memeImg })), (0, jsx_runtime_1.jsx)(components_1.Text, { style: memeDesc, children: content.memeOfTheDay.description })] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: cardHeader, children: "\uD83D\uDCF0 SERIOUS NEWS BUT MAKE IT STUPID" }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: divider }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: newsHeadline, children: ["\uD83D\uDCCC ", content.seriousNewsStupid.headline] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: newsTake, children: ["Our take: ", content.seriousNewsStupid.take] })] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: cardHeader, children: "\uD83D\uDC80 WHO GOT COOKED TODAY" }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: divider }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: cookedWho, children: ["\uD83C\uDFAF ", content.whoGotCooked.who] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: cookedWhat, children: content.whoGotCooked.what })] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: { ...card, borderColor: '#39ff14', borderWidth: '2px' }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: cardHeader, children: "\uD83C\uDFB2 RANDOM UNHINGED FACT" }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: divider }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: factText, children: content.unhingedFact })] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: footer, children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: { ...divider, marginBottom: '20px' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerText, children: "Made with \uD83E\uDDE0 and absolutely zero brain cells" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerText, children: "You signed up for this. We're not sorry." }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerLinks, children: (0, jsx_runtime_1.jsx)(components_1.Link, { href: unsubscribeUrl, style: unsubLink, children: "Unsubscribe (coward)" }) }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerSmall, children: "\u00A9 The Daily Rot. All rights reserved, none of them meaningful." })] })] })] })] }));
}
// Styles
const main = {
    backgroundColor: '#0a0a0a',
    fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    margin: '0',
    padding: '0',
};
const header = {
    backgroundColor: '#0a0a0a',
    textAlign: 'center',
    padding: '40px 20px 20px',
    borderBottom: '2px solid #39ff14',
};
const logo = {
    color: '#39ff14',
    fontSize: '48px',
    fontWeight: '900',
    letterSpacing: '-2px',
    margin: '0',
    textTransform: 'uppercase',
    textShadow: '0 0 30px #39ff1480',
};
const issueTag = {
    color: '#39ff14',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '4px',
    margin: '8px 0',
    opacity: 0.8,
};
const tagline = {
    color: '#888',
    fontSize: '14px',
    margin: '0 0 16px',
    fontStyle: 'italic',
};
const container = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
};
const card = {
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '16px',
};
const cardHeader = {
    color: '#39ff14',
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    margin: '0 0 4px',
};
const cardSubtitle = {
    color: '#555',
    fontSize: '12px',
    margin: '0',
};
const divider = {
    borderColor: '#222',
    margin: '16px 0',
};
const rotItem = {
    marginBottom: '16px',
};
const rotTitle = {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 6px',
};
const rotDesc = {
    color: '#aaa',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
};
const memeImg = {
    width: '100%',
    borderRadius: '6px',
    marginBottom: '12px',
};
const memeDesc = {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: '0',
    textAlign: 'center',
};
const newsHeadline = {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 12px',
};
const newsTake = {
    color: '#aaa',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
    borderLeft: '3px solid #39ff14',
    paddingLeft: '12px',
};
const cookedWho = {
    color: '#39ff14',
    fontSize: '18px',
    fontWeight: '800',
    margin: '0 0 10px',
};
const cookedWhat = {
    color: '#aaa',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
};
const factText = {
    color: '#fff',
    fontSize: '15px',
    lineHeight: '1.7',
    margin: '0',
    fontStyle: 'italic',
};
const footer = {
    textAlign: 'center',
    padding: '20px 0 40px',
};
const footerText = {
    color: '#444',
    fontSize: '12px',
    margin: '4px 0',
};
const footerLinks = {
    margin: '16px 0 8px',
};
const unsubLink = {
    color: '#555',
    fontSize: '12px',
    textDecoration: 'underline',
};
const footerSmall = {
    color: '#333',
    fontSize: '10px',
    margin: '0',
};
exports.default = IssueEmail;
