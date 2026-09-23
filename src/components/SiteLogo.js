import Link from 'next/link';
import { BASE_PATH } from '@/lib/basePath';

// The SJJ logo in the top-left corner of every page (public and admin),
// linking home. Rendered once from the root layout. It sits in its own
// thin row above each page's content rather than floating over it, so
// it can never cover a page heading on a narrow phone screen.
export default function SiteLogo() {
  return (
    <header className="px-4 pt-3">
      <Link href="/" aria-label="SJJ Lacrosse Stats home" className="inline-block">
        <img
          src={`${BASE_PATH}/sjj-logo.png`}
          srcSet={`${BASE_PATH}/sjj-logo.png 1x, ${BASE_PATH}/sjj-logo@2x.png 2x`}
          alt="St. John's Jesuit"
          width={45}
          height={40}
          className="h-10 w-auto"
        />
      </Link>
    </header>
  );
}
