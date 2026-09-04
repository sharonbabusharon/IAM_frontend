<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { read_session_user } from '$lib/session.js';

    onMount(async () => {
        if (read_session_user()) {
            goto('/account', { replaceState: true });
            return;
        }
        try {
            const response = await fetch('/auth/session');
            const data = await response.json();
            if (data && data.authenticated) {
                goto('/account', { replaceState: true });
                return;
            }
        } catch (error) {
        }
        goto('/login', { replaceState: true });
    });
</script>

<div class="boot_screen">
    <div class="boot_spinner" aria-label="Loading"></div>
</div>

<style>
    .boot_screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .boot_spinner {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.14);
        border-top-color: var(--accent_primary);
        animation: boot_spin 0.8s linear infinite;
    }
    @keyframes boot_spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
