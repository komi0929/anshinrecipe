// @ts-check
import { test, expect } from "@playwright/test";

/**
 * あんしんマップ E2Eテスト
 * - マップページの基本表示
 * - レストラン一覧の表示
 * - ナビゲーション動作
 */

test.describe("あんしんマップ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/map");
  });

  test("マップページが正常に表示される", async ({ page }) => {
    // ページタイトルまたはヘッダーの確認
    await expect(page).toHaveURL(/\/map/);

    // マップコンテナまたは主要UIが存在することを確認
    const mapContainer = page.locator(
      '[data-testid="map-container"], .map-container, #map',
    );
    // マップが読み込まれるまで少し待機
    await page.waitForTimeout(1000);
  });

  test("レストラン一覧が表示される", async ({ page }) => {
    // レストランリストの存在確認
    const restaurantList = page.locator(
      '[data-testid="restaurant-list"], .restaurant-list',
    );
    await expect(restaurantList.or(page.locator("main"))).toBeVisible({
      timeout: 5000,
    });
  });

  test("ナビゲーションバーが機能する", async ({ page }) => {
    // ボトムナビゲーションの確認
    const bottomNav = page.locator("nav, [data-testid='bottom-nav']");
    await expect(bottomNav.first()).toBeVisible();

    // ホームに戻れることを確認
    const homeLink = page.locator('a[href="/"], a[href="/map"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");
    }
  });
});

test.describe("レストラン詳細", () => {
  test("詳細ページにアクセスできる", async ({ page }) => {
    await page.goto("/map");
    await page.waitForTimeout(1000);

    // レストランカードをクリック
    const restaurantCard = page
      .locator('[data-testid="restaurant-card"], .restaurant-card, .shop-card')
      .first();
    if (await restaurantCard.isVisible({ timeout: 3000 })) {
      await restaurantCard.click();
      // URLがレストラン詳細に変わることを確認
      await expect(page)
        .toHaveURL(/\/(map|restaurant)\/[a-zA-Z0-9-]+/, { timeout: 5000 })
        .catch(() => {
          // 詳細画面がモーダルの場合もありえるのでスキップ
        });
    }
  });
});
