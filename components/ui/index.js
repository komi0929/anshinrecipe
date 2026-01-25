/**
 * UIコンポーネント エクスポートインデックス（92件改善 Phase5）
 * 統一的なUIコンポーネントのインポートを可能に
 */

// ローディング・エラー状態
export {
  LoadingSpinner,
  SkeletonCard,
  EmptyState,
  ErrorState,
  PullToRefresh,
} from "./LoadingStates";

// トースト・確認ダイアログ
export { toast, ToastContainer, ConfirmDialog } from "./Toast";

// アニメーション
export { AnimationStyles, Animated, StaggeredList } from "./Animations";

// ボタン（既存拡張）
export { Button } from "./Button";

// インプット（既存拡張）
export { Input } from "./Input";

// モーダル・シート
export { Modal, BottomSheet, Drawer } from "./Modal";

// タブ・チップ
export { Tabs, SegmentControl, Chip } from "./Tabs";

// カード・アバター (Phase5追加)
export { Card, CardHeader, Avatar, AvatarGroup, AvatarUploader } from "./Card";

// アクセシビリティ (Phase5追加)
export {
  SkipLink,
  VisuallyHidden,
  FocusTrap,
  LiveRegion,
  RequiredLabel,
  FormError,
  ProgressBar,
  IconButtonA11y,
} from "./Accessibility";

// パフォーマンス (Phase5追加)
export {
  LazyImage,
  InfiniteScroll,
  VirtualList,
  DebouncedSearch,
  MemoizedComponent,
} from "./Performance";

// レイアウト (Phase5追加)
export { Container, Show, Grid, Flex, Spacer, Divider } from "./Layout";

// ナビゲーション (Phase5追加)
export { Breadcrumb, StepIndicator, Pagination } from "./Navigation";

// フォームコントロール (Phase5追加)
export { Select, Switch, Badge } from "./FormControls";

// 画像アップロード (Phase5追加)
export { default as ImageUploader } from "./ImageUploader";

// アラート (Phase5追加)
export { Alert, BannerAlert, Hint } from "./Alert";

// レーティング (Phase5追加)
export { StarRating, RatingSummary } from "./Rating";

// ツールチップ (Phase5追加)
export { Tooltip, CopyButton, ShareableLink } from "./Tooltip";
