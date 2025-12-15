from BetterMITM.addons import anticache
from BetterMITM.addons import anticomp
from BetterMITM.addons import block
from BetterMITM.addons import blocklist
from BetterMITM.addons import browser
from BetterMITM.addons import clientplayback
from BetterMITM.addons import command_history
from BetterMITM.addons import comment
from BetterMITM.addons import core
from BetterMITM.addons import cut
from BetterMITM.addons import disable_h2c
from BetterMITM.addons import dns_resolver
from BetterMITM.addons import export
from BetterMITM.addons import maplocal
from BetterMITM.addons import mapremote
from BetterMITM.addons import modifybody
from BetterMITM.addons import modifyheaders
from BetterMITM.addons import next_layer
from BetterMITM.addons import onboarding
from BetterMITM.addons import advanced_interceptor
from BetterMITM.addons import smart_rules_engine
from BetterMITM.addons import rate_limiter
from BetterMITM.addons import mock_responses
from BetterMITM.addons import web_script_executor
from BetterMITM.addons import proxyauth
from BetterMITM.addons import proxyserver
from BetterMITM.addons import save
from BetterMITM.addons import savehar
from BetterMITM.addons import script
from BetterMITM.addons import serverplayback
from BetterMITM.addons import stickyauth
from BetterMITM.addons import stickycookie
from BetterMITM.addons import strip_dns_https_records
from BetterMITM.addons import tlsconfig
from BetterMITM.addons import update_alt_svc
from BetterMITM.addons import upstream_auth


def default_addons():
    return [
        core.Core(),
        browser.Browser(),
        block.Block(),
        strip_dns_https_records.StripDnsHttpsRecords(),
        blocklist.BlockList(),
        anticache.AntiCache(),
        anticomp.AntiComp(),
        clientplayback.ClientPlayback(),
        command_history.CommandHistory(),
        comment.Comment(),
        cut.Cut(),
        disable_h2c.DisableH2C(),
        export.Export(),
        onboarding.Onboarding(),
        proxyauth.ProxyAuth(),
        proxyserver.Proxyserver(),
        script.ScriptLoader(),
        dns_resolver.DnsResolver(),
        next_layer.NextLayer(),
        serverplayback.ServerPlayback(),
        mapremote.MapRemote(),
        maplocal.MapLocal(),
        modifybody.ModifyBody(),
        modifyheaders.ModifyHeaders(),
        advanced_interceptor.AdvancedInterceptor(),
        smart_rules_engine.SmartRulesEngine(),
        rate_limiter.RateLimiter(),
        mock_responses.MockResponses(),
        web_script_executor.get_web_script_executor(),
        stickyauth.StickyAuth(),
        stickycookie.StickyCookie(),
        save.Save(),
        savehar.SaveHar(),
        tlsconfig.TlsConfig(),
        upstream_auth.UpstreamAuth(),
        update_alt_svc.UpdateAltSvc(),
    ]
