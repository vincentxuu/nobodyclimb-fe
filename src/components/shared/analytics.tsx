'use client'

import Script from 'next/script'

/**
 * Analytics 追蹤組件
 * 整合 Google Analytics、Microsoft Clarity 和 PostHog
 *
 * 環境變數設定：
 * - NEXT_PUBLIC_ENABLE_ANALYTICS: 是否啟用追蹤工具 ('true' 啟用，其他值或未設定則關閉)
 * - NEXT_PUBLIC_GA_ID: Google Analytics 測量 ID (G-XXXXXXXXXX)
 * - NEXT_PUBLIC_CLARITY_ID: Microsoft Clarity 專案 ID
 * - NEXT_PUBLIC_POSTHOG_KEY: PostHog API Key
 * - NEXT_PUBLIC_POSTHOG_HOST: PostHog Host (預設: https://us.i.posthog.com)
 *
 * 使用方式：
 * - 開發環境：不設定 NEXT_PUBLIC_ENABLE_ANALYTICS 或設為 'false'
 * - 正式環境：設定 NEXT_PUBLIC_ENABLE_ANALYTICS='true' 並配置各追蹤工具的 ID
 */
const enableAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
const gaId = process.env.NEXT_PUBLIC_GA_ID
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

export function Analytics() {
  // 如果未啟用追蹤，直接返回 null
  if (!enableAnalytics) {
    return null
  }

  return (
    <>
      {/* Google Analytics */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity */}
      {clarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}

      {/* PostHog */}
      {posthogKey && (
        <Script id="posthog" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${posthogKey}', {
              api_host: '${posthogHost}',
              person_profiles: 'identified_only',
              capture_pageview: true,
              capture_pageleave: true
            });
          `}
        </Script>
      )}
    </>
  )
}
