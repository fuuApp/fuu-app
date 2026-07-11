import UIKit
import Capacitor
import WebKit

/// SSL証明書チャレンジをインターセプトし、それ以外はCapacitorの
/// デフォルトデリゲートに転送するプロキシ
private class SSLBypassProxy: NSObject, WKNavigationDelegate {
    weak var target: WKNavigationDelegate?

    func webView(_ webView: WKWebView,
                 didReceive challenge: URLAuthenticationChallenge,
                 completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
           challenge.protectionSpace.host.hasSuffix("vercel.app"),
           let trust = challenge.protectionSpace.serverTrust {
            completionHandler(.useCredential, URLCredential(trust: trust))
        } else {
            target?.webView?(webView, didReceive: challenge, completionHandler: completionHandler)
            ?? completionHandler(.performDefaultHandling, nil)
        }
    }

    // SSL以外のナビゲーションイベントはCapacitorのデリゲートに転送
    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || (target?.responds(to: aSelector) ?? false)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        (target?.responds(to: aSelector) == true) ? target : super.forwardingTarget(for: aSelector)
    }
}

class MainViewController: CAPBridgeViewController {
    private var sslProxy: SSLBypassProxy?

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let wv = webView else { return }
        let proxy = SSLBypassProxy()
        proxy.target = wv.navigationDelegate  // Capacitorのデリゲートを保持
        wv.navigationDelegate = proxy
        sslProxy = proxy  // 参照を保持（解放防止）
    }
}
