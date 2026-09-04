<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import BrandMark from '$lib/ui_elements/BrandMark.svelte';
    import ProviderButton from '$lib/ui_elements/ProviderButton.svelte';
    import InlineAlert from '$lib/ui_elements/InlineAlert.svelte';
    import { sso_providers } from '$lib/providers.js';
    import { build_sso_login_url } from '$lib/config.js';

    let redirecting_provider = '';
    let error_message = '';

    const error_copy = {
        missing_code: 'Sign-in did not complete. Please try again.',
        login_failed: 'We could not sign you in with that provider. Please try again.',
        account_suspended: 'This account has been suspended. Contact an administrator.',
        provider_disabled: 'That sign-in option is currently unavailable.',
        rate_limited: 'Too many attempts. Please wait a moment and try again.',
        iam_unreachable: 'The sign-in service is unreachable right now. Please try again shortly.'
    };

    function friendly_error(code) {
        return error_copy[code] || 'Something went wrong. Please try again.';
    }

    onMount(() => {
        const code = $page.url.searchParams.get('error');
        if (code) {
            error_message = friendly_error(code);
        }
    });

    function start_sso(provider) {
        if (redirecting_provider) return;
        error_message = '';
        redirecting_provider = provider.slug;
        const return_to = window.location.origin + '/auth/callback';
        window.location.href = build_sso_login_url(provider.slug, return_to);
    }
</script>

<svelte:head>
    <title>Sign in</title>
</svelte:head>

<main class="login_page">
    <div class="login_shell">
        <div class="login_brand">
            <BrandMark size="lg" subtitle="Central identity for the ecosystem" />
        </div>

        <section class="card login_card">
            <header class="login_head">
                <h1 class="login_title">Sign in</h1>
                <p class="login_subtitle">Choose a provider to continue.</p>
            </header>

            {#if error_message}
                <InlineAlert variant="error">{error_message}</InlineAlert>
            {/if}

            <div class="provider_grid">
                {#each sso_providers as provider (provider.slug)}
                    <ProviderButton
                        {provider}
                        compact
                        disabled={!!redirecting_provider}
                        on:click={() => start_sso(provider)}
                    />
                {/each}
            </div>
        </section>

        <footer class="login_footer">
            <span>By continuing you agree to our Terms and Privacy Policy.</span>
            <nav class="footer_links">
                <a href="/">Privacy</a>
                <a href="/">Terms</a>
                <a href="/">Support</a>
            </nav>
        </footer>
    </div>
</main>

<style>
    .login_page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing_5xl) var(--spacing_xl);
    }
    .login_shell {
        width: 100%;
        max-width: 440px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing_3xl);
    }
    .login_brand {
        display: flex;
        justify-content: center;
    }
    .login_card {
        width: 100%;
        padding: var(--spacing_4xl) var(--spacing_3xl);
        display: flex;
        flex-direction: column;
        gap: var(--spacing_2xl);
    }
    .login_head {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: var(--spacing_sm);
    }
    .login_title {
        font-size: var(--font_size_2xl);
    }
    .login_subtitle {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
    }
    .provider_grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing_md);
    }
    .login_footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing_md);
        text-align: center;
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
    }
    .footer_links {
        display: flex;
        gap: var(--spacing_xl);
    }
    .footer_links a {
        color: var(--text_tertiary);
    }
    .footer_links a:hover {
        color: var(--text_secondary);
    }

    @media (max-width: 420px) {
        .provider_grid {
            grid-template-columns: 1fr;
        }
    }
</style>
