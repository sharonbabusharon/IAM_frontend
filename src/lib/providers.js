import { provider_icons } from './provider_icons.js';

export const sso_providers = [
    { slug: 'google', label: 'Google', brand_color: '#ffffff', icon: provider_icons.google },
    { slug: 'azure', label: 'Microsoft', brand_color: '#ffffff', icon: provider_icons.azure },
    { slug: 'github', label: 'GitHub', brand_color: '#e8e8ea', icon: provider_icons.github },
    { slug: 'linkedin_oidc', label: 'LinkedIn', brand_color: '#3aa0ff', icon: provider_icons.linkedin_oidc },
    { slug: 'facebook', label: 'Facebook', brand_color: '#4f8cff', icon: provider_icons.facebook },
    { slug: 'twitter', label: 'X', brand_color: '#e8e8ea', icon: provider_icons.twitter },
    { slug: 'gitlab', label: 'GitLab', brand_color: '#fc6d26', icon: provider_icons.gitlab },
    { slug: 'discord', label: 'Discord', brand_color: '#8b90f7', icon: provider_icons.discord },
    { slug: 'twitch', label: 'Twitch', brand_color: '#a970ff', icon: provider_icons.twitch },
    { slug: 'slack_oidc', label: 'Slack', brand_color: '#e8e8ea', icon: provider_icons.slack_oidc },
    { slug: 'snapchat', label: 'Snapchat', brand_color: '#fffc00', icon: provider_icons.snapchat }
];

export function get_provider_meta(slug) {
    return (
        sso_providers.find((provider) => provider.slug === slug) || {
            slug: slug,
            label: slug,
            brand_color: '#e8e8ea',
            icon: ''
        }
    );
}
