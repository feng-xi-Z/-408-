package com.kaoyan.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;

/**
 * 研途 408 —— 单 Activity + WebView 容器。
 * 页面本体是 assets/kaoyan.html（完全离线，不联网）。
 */
public class MainActivity extends Activity {

    private static final String ORIGIN = "https://appassets.androidplatform.net/";
    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySystemBars();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F4F5F7"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        // 用固定的 https 源提供本地资源：localStorage 有稳定的同源，行为与浏览器一致
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl() == null ? "" : request.getUrl().toString();
                if (url.startsWith(ORIGIN)) {
                    String path = url.substring(ORIGIN.length());
                    int q = path.indexOf('?');
                    if (q >= 0) path = path.substring(0, q);
                    int h = path.indexOf('#');
                    if (h >= 0) path = path.substring(0, h);
                    if (path.isEmpty()) path = "kaoyan.html";
                    try {
                        InputStream is = getAssets().open(path);
                        String mime = path.endsWith(".html") ? "text/html"
                                : path.endsWith(".js") ? "application/javascript"
                                : path.endsWith(".css") ? "text/css"
                                : "application/octet-stream";
                        return new WebResourceResponse(mime, "utf-8", is);
                    } catch (IOException e) {
                        return new WebResourceResponse("text/plain", "utf-8", null);
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        setContentView(web);
        // 直接以本地资源方式加载：不发起任何网络请求，也不需要联网权限
        web.loadUrl("file:///android_asset/kaoyan.html");
    }

    private void applySystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window w = getWindow();
            w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            w.setStatusBarColor(Color.parseColor("#F4F5F7"));
            w.setNavigationBarColor(Color.parseColor("#FFFFFF"));
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }

    /** 系统返回键优先交给页面内部的历史栈，回不去时才退出。 */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && web != null) {
            web.evaluateJavascript(
                    "(function(){try{return window.__back()?'true':'false'}catch(e){return 'false'}})()",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"true".equals(value)) finish();
                        }
                    });
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
