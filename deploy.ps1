# Set console output encoding to UTF-8 to support Chinese characters in terminal
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "      LudeLee 部落格與作品集 - 一鍵自動部署工具" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""

# 檢查 Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show('找不到 Git 執行檔，請先安裝 Git。', '部署失敗', 0, 16)
    Write-Host "❌ [錯誤] 找不到 Git 執行檔，請確認電腦中已安裝 Git。" -ForegroundColor Red
    Start-Sleep -Seconds 3
    Exit
}

# 讓使用者輸入更新說明
$commitMsg = Read-Host "請輸入本次更新說明 (直接按 Enter 則使用預設: 更新網站內容與文章)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "更新網站內容與文章"
}

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "[1/3] 正在將檔案加入 Git 暫存區..." -ForegroundColor Cyan
git add .

Write-Host "[2/3] 正在提交變更..." -ForegroundColor Cyan
git commit -m $commitMsg

Write-Host "[3/3] 正在推送到 GitHub..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "🎉 成功推送！最新變更正在同步至 GitHub Pages。" -ForegroundColor Green
    Write-Host "👉 已為您開啟 GitHub Actions 部署進度頁面。" -ForegroundColor Green
    Write-Host "👉 當頁面中的黃色圈圈旋轉圖示變成「綠色勾勾」時，即可重整網站看見新內容！" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    
    # 自動開啟 GitHub Actions 進度頁面
    Start-Process "https://github.com/leelide/personal-blog-resume/actions"
} else {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "❌ [錯誤] 推送失敗！請檢查您的網路連線或 GitHub 存取權限。" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "按 Enter 鍵關閉此視窗"
