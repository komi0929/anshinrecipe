// Simulating SNS Collector
export async function collectFromSNS(area) {
    // Mock simulation
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    shopName: `Insta Cafe ${area}`,
                    address: `${area}博多区2-2`,
                    source: { type: 'sns', url: 'https://instagram.com/post/123' },
                    hasPhotos: true,
                    menus: [
                        { name: "グルテンフリーパンケーキ", supportedAllergens: ["小麦"], collectedDate: new Date().toISOString() },
                        { name: "卵不使用プリン", supportedAllergens: ["卵"], collectedDate: new Date().toISOString() }
                    ],
                    collectedAt: new Date().toISOString()
                }
            ]);
        }, 1500);
    });
}
