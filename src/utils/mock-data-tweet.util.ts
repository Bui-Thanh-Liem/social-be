import { ObjectId } from 'mongodb'
import { logger } from './logger.util'
import TweetsService from '~/modules/tweets/tweets.service'
import { ETweetType } from '~/shared/enums/type.enum'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

// const tweets = [
//   {
//     content:
//       "🚨 [Node.js] Lỗi 'ERR_IPC_CHANNEL_CLOSED' khi giao tiếp process. \n🛠️ Cách fix: Kiểm tra process con còn sống không trước khi gửi message bằng try-catch."
//   },
//   {
//     content:
//       "🔍 [ExpressJS] Lỗi 'PayloadTooLargeError' khi gửi body quá nặng. \n🛠️ Cách fix: Cấu hình app.use(express.json({ limit: '50mb' })) để tăng giới hạn nhận dữ liệu."
//   },
//   {
//     content:
//       "🛠️ [NestJS] Lỗi 'Can't resolve dependencies of XService'. \n🛠️ Cách fix: Kiểm tra mảng providers trong Module hoặc đã imports Module chứa service đó chưa."
//   },
//   {
//     content:
//       "💡 [Prisma] Lỗi 'P2002: Unique constraint failed'. \n🛠️ Cách fix: Dữ liệu đã tồn tại, dùng findUnique kiểm tra trước khi thực hiện hành động create."
//   },
//   {
//     content:
//       "🚀 [Redis] Lỗi 'OOM command not allowed'. \n🛠️ Cách fix: Cấu hình chính sách maxmemory-policy allkeys-lru để tự động giải phóng các key cũ."
//   },
//   {
//     content:
//       "🛡️ [Security] Thiếu 'Strict-Transport-Security' header. \n🛠️ Cách fix: Sử dụng middleware helmet() để tự động thêm các security headers quan trọng cho app."
//   },
//   {
//     content:
//       "⚡ [Node.js] Lỗi 'ECONNRESET' khi gọi API bên thứ ba. \n🛠️ Cách fix: Đảm bảo server đích không chặn IP và sử dụng cơ chế Exponential Backoff để retry."
//   },
//   {
//     content:
//       "📦 [Docker] Lỗi 'manifest for image not found'. \n🛠️ Cách fix: Kiểm tra lại tên image và tag, đảm bảo image tồn tại trên Docker Hub hoặc Registry."
//   },
//   {
//     content:
//       "🔑 [JWT] Lỗi 'SecretOrPrivateKey must have a value'. \n🛠️ Cách fix: Kiểm tra file .env, đảm bảo biến môi trường cho JWT Secret đã được nạp thành công."
//   },
//   {
//     content:
//       "💾 [MongoDB] Lỗi 'BSONObj size is invalid' (>16MB). \n🛠️ Cách fix: Dùng GridFS để lưu file lớn hoặc chỉ lưu link dẫn đến S3 thay vì lưu trực tiếp vào doc."
//   },
//   {
//     content:
//       "🏗️ [TypeORM] Lỗi 'EntityMetadataNotFound'. \n🛠️ Cách fix: Kiểm tra đường dẫn entities trong config, dùng dist/**/*.entity.js cho môi trường production."
//   },
//   {
//     content:
//       "🧬 [TypeScript] Lỗi 'Implicitly has an any type'. \n🛠️ Cách fix: Cung cấp interface/type rõ ràng cho biến hoặc cấu hình lại strict: false trong tsconfig."
//   },
//   {
//     content:
//       '📉 [Performance] Hệ thống bị Memory Leak do biến global. \n🛠️ Cách fix: Tránh dùng biến global lưu data lớn, chuyển sang dùng Redis hoặc dọn dẹp biến sau khi dùng.'
//   },
//   {
//     content:
//       "📞 [Microservices] Lỗi 'gRPC status: UNAVAILABLE'. \n🛠️ Cách fix: Kiểm tra service đích đã up chưa và chứng chỉ SSL/TLS giữa các bên có khớp nhau không."
//   },
//   {
//     content:
//       "🔀 [Express] Lỗi 'Router.use() requires a middleware but got Object'. \n🛠️ Cách fix: Kiểm tra file export route, dùng module.exports = router thay vì export object thường."
//   },
//   {
//     content:
//       "📜 [NestJS] Lỗi '@InjectRepository() không nhận ra Entity'. \n🛠️ Cách fix: Đăng ký Entity đó trong mảng TypeOrmModule.forFeature([Entity]) tại module đang dùng."
//   },
//   {
//     content:
//       "🛠️ [DevOps] Lỗi 'Permission denied' khi chạy script Linux. \n🛠️ Cách fix: Sử dụng lệnh chmod +x script.sh để cấp quyền thực thi cho file script đó."
//   },
//   {
//     content:
//       "📡 [Socket.io] Lỗi 'Cross-Origin Request Blocked'. \n🛠️ Cách fix: Cấu hình option cors cho socket server: { cors: { origin: '*' } } để nhận kết nối."
//   },
//   {
//     content:
//       "🧊 [Node.js] Lỗi 'ERR_ASSERTION' khi unit test. \n🛠️ Cách fix: Kiểm tra lại logic hàm expect(), dữ liệu thực tế đang trả về khác với giá trị mong đợi."
//   },
//   {
//     content:
//       "🗄️ [Postgres] Lỗi 'deadlock detected' khi update đồng thời. \n🛠️ Cách fix: Sắp xếp các transaction update theo cùng một thứ tự ID để tránh xung đột khoá."
//   },
//   {
//     content:
//       "🧪 [Jest] Lỗi 'A worker process has failed to exit gracefully'. \n🛠️ Cách fix: Sử dụng flag --forceExit hoặc kiểm tra các kết nối database/socket chưa đóng sau test."
//   },
//   {
//     content:
//       "🔌 [MongoDB] Lỗi 'Topology is closed'. \n🛠️ Cách fix: Kiểm tra kết nối DB có bị ngắt đột ngột không, đảm bảo không gọi client.close() quá sớm."
//   },
//   {
//     content:
//       "🛠️ [NPM] Lỗi 'peer dependencies conflict'. \n🛠️ Cách fix: Sử dụng flag --legacy-peer-deps khi cài đặt để bỏ qua xung đột phiên bản không trọng yếu."
//   },
//   {
//     content:
//       "🚀 [GCP] Lỗi 'Quota exceeded' khi dùng Cloud Function. \n🛠️ Cách fix: Kiểm tra giới hạn tài khoản hoặc tối ưu hóa số lượng instance xử lý trong Google Console."
//   },
//   {
//     content:
//       "🔥 [Firebase] Lỗi 'Permission denied' ở Firestore. \n🛠️ Cách fix: Cấu hình lại Rules trong Firebase Console để cho phép user/admin có quyền đọc ghi."
//   },
//   {
//     content:
//       "🔧 [NestJS] Lỗi 'Invalid metadata' khi dùng Swagger. \n🛠️ Cách fix: Đảm bảo các DTO sử dụng decorator @ApiProperty() và file main.ts đã setup Swagger chuẩn."
//   },
//   {
//     content:
//       "🛑 [Node.js] Lỗi 'Module not found'. \n🛠️ Cách fix: Kiểm tra lại tên package trong package.json và chạy npm install để cập nhật node_modules."
//   },
//   {
//     content:
//       "🌐 [Axios] Lỗi 'Network Error' khi gọi API. \n🛠️ Cách fix: Kiểm tra URL có đúng không, server backend có đang chạy và có hỗ trợ CORS cho domain hiện tại."
//   },
//   {
//     content:
//       "🏗️ [Webpack] Lỗi 'Module build failed'. \n🛠️ Cách fix: Kiểm tra lại các loader trong webpack.config.js, đảm bảo đã cài đủ babel-loader hoặc ts-loader."
//   },
//   {
//     content:
//       "🛡️ [Auth] Lỗi 'Invalid token' khi dùng Passport.js. \n🛠️ Cách fix: Kiểm tra secret key và thuật toán sign token (HS256/RS256) có khớp với phía verify."
//   },
//   {
//     content:
//       "📊 [Prometheus] Lỗi 'Scrape target down'. \n🛠️ Cách fix: Kiểm tra endpoint /metrics của ứng dụng có đang hoạt động và firewall có chặn port không."
//   },
//   {
//     content:
//       "🧱 [Docker] Lỗi 'No space left on device'. \n🛠️ Cách fix: Chạy docker system prune để xoá các image, volume và container cũ không còn sử dụng."
//   },
//   {
//     content:
//       "⚙️ [Linux] Lỗi 'Too many open files'. \n🛠️ Cách fix: Tăng giới hạn ulimit của hệ thống hoặc tối ưu việc đóng file descriptor sau khi xử lý."
//   },
//   {
//     content:
//       "🌀 [Redis] Lỗi 'Connection loss' khi pub/sub. \n🛠️ Cách fix: Kiểm tra cấu hình timeout của Redis và đảm bảo client có cơ chế tự động reconnect."
//   },
//   {
//     content:
//       "💉 [SQL] Lỗi 'Syntax error' gần dấu phẩy. \n🛠️ Cách fix: Kiểm tra lại các câu lệnh SQL dynamic, sử dụng query builder để tránh sai sót cú pháp."
//   },
//   {
//     content:
//       "📦 [Yarn] Lỗi 'Integrity check failed'. \n🛠️ Cách fix: Xoá file yarn.lock và thư mục node_modules rồi chạy yarn install lại từ đầu."
//   },
//   {
//     content:
//       "🧩 [Mongoose] Lỗi 'Cast to ObjectId failed'. \n🛠️ Cách fix: Kiểm tra ID truyền vào có đúng định dạng 24 ký tự hex của MongoDB không trước khi tìm kiếm."
//   },
//   {
//     content:
//       "🔐 [Bcrypt] Lỗi 'data and salt arguments required'. \n🛠️ Cách fix: Đảm bảo biến mật khẩu không bị undefined hoặc null trước khi truyền vào hàm hash/compare."
//   },
//   {
//     content:
//       "🚦 [RateLimit] Lỗi 'Too many requests'. \n🛠️ Cách fix: Tăng giới hạn rate limit cho các IP tin cậy hoặc hướng dẫn client chờ sau một khoảng thời gian."
//   },
//   {
//     content:
//       "🏗️ [TypeORM] Lỗi 'QueryFailedError: relation does not exist'. \n🛠️ Cách fix: Kiểm tra tên bảng trong DB và Entity có khớp nhau không, hoặc đã chạy migration chưa."
//   },
//   {
//     content:
//       "☁️ [AWS] Lỗi 'Access Denied' khi upload S3. \n🛠️ Cách fix: Kiểm tra IAM Policy của User và quyền Public Access của Bucket trong AWS Console."
//   },
//   {
//     content:
//       "🛠️ [NestJS] Lỗi 'Pipe not found'. \n🛠️ Cách fix: Đảm bảo đã khai báo Pipe trong mảng providers hoặc dùng decorator @UsePipes() ở level controller."
//   },
//   {
//     content:
//       "📝 [Winston] Lỗi 'Transport not found'. \n🛠️ Cách fix: Kiểm tra cấu hình logger, đảm bảo đã khai báo transport (File, Console, hoặc HTTP) đúng cú pháp."
//   },
//   {
//     content:
//       "🧪 [Cypress] Lỗi 'Timed out retrying'. \n🛠️ Cách fix: Tăng thời gian wait hoặc kiểm tra selector CSS của phần tử có thay đổi hay không."
//   },
//   {
//     content:
//       "🔧 [ESLint] Lỗi 'Definition for rule not found'. \n🛠️ Cách fix: Cập nhật các plugin eslint hoặc kiểm tra lại file config .eslintrc xem có rule nào bị cũ không."
//   },
//   {
//     content:
//       "🗄️ [Sequelize] Lỗi 'ConnectionAcquireTimeoutError'. \n🛠️ Cách fix: Tăng giá trị pool.acquire trong cấu hình database hoặc kiểm tra số lượng connection hiện có."
//   },
//   {
//     content:
//       "🛡️ [HTTPS] Lỗi 'SSL Certificate Expired'. \n🛠️ Cách fix: Cập nhật chứng chỉ SSL mới (Certbot/Let's Encrypt) và khởi động lại server web."
//   },
//   {
//     content:
//       "🌐 [Nginx] Lỗi '502 Bad Gateway'. \n🛠️ Cách fix: Kiểm tra service backend (Nodejs) có đang chạy không và Nginx có trỏ đúng port không."
//   },
//   {
//     content:
//       "🚀 [PM2] Lỗi 'Script not found'. \n🛠️ Cách fix: Kiểm tra đường dẫn file chạy trong pm2 start có chính xác so với thư mục hiện hành không."
//   },
//   {
//     content:
//       "⚙️ [Node.js] Lỗi 'ERR_STREAM_WRITE_AFTER_END'. \n🛠️ Cách fix: Đảm bảo không ghi thêm dữ liệu vào stream sau khi đã gọi hàm .end() hoặc .destroy()."
//   },
//   {
//     content:
//       "📦 [Kubernetes] Lỗi 'ImagePullBackOff'. \n🛠️ Cách fix: Kiểm tra image name, tag và bí mật (secret) để truy cập private registry có đúng không."
//   },
//   {
//     content:
//       "🧩 [NestJS] Lỗi 'Transform failed' ở DTO. \n🛠️ Cách fix: Kiểm tra decorator @Type() từ class-transformer đã được import đúng cho các object lồng nhau chưa."
//   },
//   {
//     content:
//       "💾 [Redis] Lỗi 'READONLY You can't write to a read only replica'. \n🛠️ Cách fix: Kiểm tra lại node Redis bạn đang kết nối là Master hay Slave trong mô hình Cluster."
//   },
//   {
//     content:
//       "🛡️ [OAuth2] Lỗi 'Invalid redirect URI'. \n🛠️ Cách fix: Khai báo chính xác URL redirect trong trang quản trị ứng dụng của Google/Facebook/Github."
//   },
//   {
//     content:
//       "🔀 [Git] Lỗi 'Permission denied (publickey)'. \n🛠️ Cách fix: Kiểm tra SSH Key đã được add vào SSH Agent và đã upload lên Github/Gitlab chưa."
//   },
//   {
//     content:
//       "🧱 [Docker] Lỗi 'Conflict. The container name is already in use'. \n🛠️ Cách fix: Xoá container cũ bằng docker rm -f [name] hoặc đổi tên container mới."
//   },
//   {
//     content:
//       "📡 [GraphQL] Lỗi 'Field X is not defined on type Y'. \n🛠️ Cách fix: Cập nhật lại Schema và Resolver, đảm bảo các field trong query khớp với Schema đã định nghĩa."
//   },
//   {
//     content:
//       "🧪 [Mocha] Lỗi 'Timeout of 2000ms exceeded'. \n🛠️ Cách fix: Sử dụng this.timeout(5000) bên trong hàm test hoặc flag --timeout trong command line."
//   },
//   {
//     content:
//       "🔧 [TypeScript] Lỗi 'Property is private and only accessible within class'. \n🛠️ Cách fix: Đổi thuộc tính sang protected hoặc public nếu cần truy cập từ class con hoặc instance."
//   },
//   {
//     content:
//       "🏗️ [NestJS] Lỗi 'Bad Gateway' khi dùng Microservice. \n🛠️ Cách fix: Kiểm tra transport layer (NATS, RabbitMQ, Redis) có đang hoạt động ổn định không."
//   },
//   {
//     content:
//       "🗃️ [Knex] Lỗi 'Migration file already exists'. \n🛠️ Cách fix: Kiểm tra thư mục migrations, xoá file trùng hoặc đổi tên file migration mới theo timestamp."
//   },
//   {
//     content:
//       "🔌 [Socket.io] Lỗi 'Session ID unknown'. \n🛠️ Cách fix: Bật sticky sessions nếu bạn đang chạy trên nhiều server sau một Load Balancer."
//   },
//   {
//     content:
//       "🛡️ [Joi] Lỗi 'Validation failed: value must be a string'. \n🛠️ Cách fix: Kiểm tra dữ liệu đầu vào, đảm bảo không gửi number hoặc object vào field yêu cầu string."
//   },
//   {
//     content:
//       "📂 [Fs] Lỗi 'EPERM: operation not permitted'. \n🛠️ Cách fix: Chạy terminal với quyền Admin hoặc kiểm tra file có đang bị ứng dụng khác mở khoá không."
//   },
//   {
//     content:
//       "🚀 [Vercel] Lỗi 'Function Runtimes'. \n🛠️ Cách fix: Kiểm tra version Node.js trong package.json có tương thích với cấu hình runtime của Vercel không."
//   },
//   {
//     content:
//       "⚙️ [Express] Lỗi 'Static files not found'. \n🛠️ Cách fix: Kiểm tra đường dẫn truyền vào express.static(), nên dùng path.join(__dirname, 'public')."
//   },
//   {
//     content:
//       "🧩 [Inversify] Lỗi 'Ambiguous binding found'. \n🛠️ Cách fix: Kiểm tra lại các khai báo bind, đảm bảo mỗi Identifier chỉ được bind tới một class duy nhất."
//   },
//   {
//     content:
//       "🛡️ [Helmet] Lỗi 'Content Security Policy' chặn script. \n🛠️ Cách fix: Cấu hình lại policy trong helmet() để cho phép các domain script cần thiết (như Google Maps)."
//   },
//   {
//     content:
//       "🧪 [Supertest] Lỗi 'Connection refused'. \n🛠️ Cách fix: Đảm bảo server đã lắng nghe port trước khi supertest thực hiện call API trong unit test."
//   },
//   {
//     content:
//       "🔧 [NestJS] Lỗi 'Cannot find module path'. \n🛠️ Cách fix: Kiểm tra cấu hình compilerOptions.paths trong tsconfig.json để NestJS nhận diện được alias."
//   },
//   {
//     content:
//       "📊 [NewRelic] Lỗi 'Agent not connecting'. \n🛠️ Cách fix: Kiểm tra license key và đảm bảo agent được require ở dòng ĐẦU TIÊN của file entry point."
//   },
//   {
//     content:
//       "🧱 [Docker] Lỗi 'Error response from daemon'. \n🛠️ Cách fix: Restart Docker service hoặc kiểm tra lại cú pháp các lệnh docker-compose.yml."
//   },
//   {
//     content:
//       "⚙️ [Node.js] Lỗi 'ERR_HTTP_INVALID_STATUS_CODE'. \n🛠️ Cách fix: Đảm bảo mã trạng thái truyền vào res.status() là số nguyên hợp lệ (ví dụ: 200, 404, 500)."
//   },
//   {
//     content:
//       "📡 [RabbitMQ] Lỗi 'Channel closed' đột ngột. \n🛠️ Cách fix: Kiểm tra cơ chế heartbeat và đảm bảo không gửi dữ liệu quá lớn làm nghẽn channel."
//   },
//   {
//     content:
//       "🗄️ [Mongoose] Lỗi 'VersionError: No matching document found'. \n🛠️ Cách fix: Xảy ra khi dùng concurrently update, hãy kiểm tra lại logic lưu dữ liệu hoặc tắt __v."
//   },
//   {
//     content:
//       "🧪 [Jest] Lỗi 'ReferenceError: regeneratorRuntime is not defined'. \n🛠️ Cách fix: Cài đặt và cấu hình @babel/plugin-transform-runtime để hỗ trợ async/await trong môi trường test."
//   },
//   {
//     content:
//       "🏗️ [TypeORM] Lỗi 'Column name not found'. \n🛠️ Cách fix: Kiểm tra lại decorator @Column() và tên field trong DB, lưu ý snake_case và camelCase."
//   },
//   {
//     content:
//       "🛠️ [NestJS] Lỗi 'Forbidden' khi gọi API. \n🛠️ Cách fix: Kiểm tra Guard và phân quyền user, đảm bảo token truyền lên có đủ quyền hạn truy cập."
//   },
//   {
//     content:
//       "🌀 [Redis] Lỗi 'Max number of clients reached'. \n🛠️ Cách fix: Tăng giá trị maxclients trong file cấu hình Redis hoặc tối ưu việc đóng client sau khi dùng."
//   },
//   {
//     content:
//       "🛡️ [Passport] Lỗi 'Session not initialized'. \n🛠️ Cách fix: Đảm bảo gọi express-session trước khi gọi passport.session() trong file config app."
//   },
//   {
//     content:
//       "📦 [NPM] Lỗi 'EACCES' khi cài global package. \n🛠️ Cách fix: Dùng nvm quản lý node hoặc config lại npm prefix để không yêu cầu quyền sudo."
//   },
//   {
//     content:
//       "⚙️ [Express] Lỗi 'View engine not found'. \n🛠️ Cách fix: Đảm bảo đã cài engine (pug, ejs) và khai báo app.set('view engine', 'ejs') đúng."
//   },
//   {
//     content:
//       "🔌 [Mongoose] Lỗi 'Buffering timed out'. \n🛠️ Cách fix: Kiểm tra chuỗi kết nối MongoDB và đảm bảo DB server đang chạy trước khi thực hiện query."
//   },
//   {
//     content:
//       "🛡️ [CORS] Lỗi 'Preflight request failed'. \n🛠️ Cách fix: Backend cần phản hồi mã 204 hoặc 200 cho các request phương thức OPTIONS từ trình duyệt."
//   },
//   {
//     content:
//       "🚀 [Heroku] Lỗi 'R10 (Boot timeout)'. \n🛠️ Cách fix: Đảm bảo ứng dụng lắng nghe cổng process.env.PORT do Heroku cung cấp thay vì hardcode 3000."
//   },
//   {
//     content:
//       "📂 [Multer] Lỗi 'Unexpected field'. \n🛠️ Cách fix: Tên trường trong upload.single('fieldname') phải khớp hoàn toàn với tên field gửi từ client."
//   },
//   {
//     content:
//       "🧪 [Jest] Lỗi 'Matcher error'. \n🛠️ Cách fix: Kiểm tra lại kiểu dữ liệu của biến so sánh, ví dụ dùng .toEqual() cho object thay vì .toBe()."
//   },
//   {
//     content:
//       "🔧 [TypeScript] Lỗi 'Cannot find name console'. \n🛠️ Cách fix: Thêm 'dom' hoặc 'node' vào mảng 'lib' trong file cấu hình tsconfig.json."
//   },
//   {
//     content:
//       "🏗️ [NestJS] Lỗi 'Invalid providers'. \n🛠️ Cách fix: Kiểm tra xem có class nào được inject mà chưa đánh dấu decorator @Injectable() hay không."
//   },
//   {
//     content:
//       "🗃️ [Postgres] Lỗi 'Relation already exists'. \n🛠️ Cách fix: Migration đang bị lệch với DB thực tế, hãy dùng --fake hoặc kiểm tra bảng knex_migrations."
//   },
//   {
//     content:
//       "📡 [GraphQL] Lỗi 'Query depth reached'. \n🛠️ Cách fix: Giới hạn độ sâu của query bằng thư viện graphql-depth-limit để tránh tấn công DoS."
//   },
//   {
//     content:
//       "🛡️ [Argon2] Lỗi 'Memory cost too high'. \n🛠️ Cách fix: Giảm thông số memoryCost trong config hash mật khẩu nếu chạy trên server RAM yếu."
//   },
//   {
//     content:
//       "⚙️ [Node.js] Lỗi 'ERR_HTTP2_STREAM_ERROR'. \n🛠️ Cách fix: Kiểm tra cấu hình HTTP/2 và đảm bảo kết nối giữa client-server không bị ngắt quãng giữa chừng."
//   },
//   {
//     content:
//       "📦 [Docker] Lỗi 'OCI runtime create failed'. \n🛠️ Cách fix: Thường do sai kiến trúc CPU (arm64 vs x86_64), hãy check flag --platform khi build image."
//   },
//   {
//     content:
//       "🧪 [Mocha] Lỗi 'Uncaught error outside test'. \n🛠️ Cách fix: Kiểm tra các đoạn code khởi tạo hoặc hooks (before/after), đảm bảo handle lỗi async đầy đủ."
//   },
//   {
//     content:
//       "🛠️ [NestJS] Lỗi 'Controller not found'. \n🛠️ Cách fix: Đảm bảo Controller đã được khai báo trong mảng controllers của Module quản lý nó."
//   },
//   {
//     content:
//       "🌐 [Axios] Lỗi 'ECONNABORTED' do timeout. \n🛠️ Cách fix: Tăng thuộc tính timeout trong config axios hoặc kiểm tra mạng tại phía server."
//   },
//   {
//     content:
//       "🗄️ [Sequelize] Lỗi 'Unknown column in field list'. \n🛠️ Cách fix: Chạy lại migration hoặc kiểm tra xem model đã đồng bộ với cấu trúc bảng thực tế chưa."
//   },
//   {
//     content:
//       '🛡️ [XSS] Lỗi thực thi script lạ trong comment. \n🛠️ Cách fix: Sử dụng thư viện dompurify để lọc sạch dữ liệu HTML do user nhập vào trước khi lưu/hiển thị.'
//   },
//   {
//     content:
//       "⚙️ [Linux] Lỗi 'Out of memory' (OOM Killer). \n🛠️ Cách fix: Tăng dung lượng Swap hoặc tối ưu hóa sử dụng bộ nhớ của ứng dụng Node.js bằng Heap dump."
//   }
// ]

// const tweets = [
//   { "content": "🚨 [Node.js] Lỗi 'ERR_WORKER_OUT_OF_MEMORY' khi dùng Worker Threads. \n🛠️ Cách fix: Giới hạn bộ nhớ cho mỗi thread bằng resourceLimits hoặc tối ưu hóa dữ liệu truyền qua worker. 🧠" },
//   { "content": "🔍 [ExpressJS] Lỗi 'Router.use() requires a middleware function'. \n🛠️ Cách fix: Kiểm tra các file route, đảm bảo đã dùng 'module.exports = router' thay vì export nhầm một object rỗng. 🔀" },
//   { "content": "🛠️ [NestJS] Lỗi 'Cannot instantiate cyclic dependency' của Provider. \n🛠️ Cách fix: Sử dụng forwardRef() trong constructor để giải quyết sự phụ thuộc vòng giữa các class. 🔄" },
//   { "content": "💡 [Prisma] Lỗi 'P2025: An operation failed because it depends on one or more records that were not found'. \n🛠️ Cách fix: Kiểm tra sự tồn tại của bản ghi trước khi thực hiện update hoặc delete. 🔍" },
//   { "content": "🚀 [Redis] Lỗi 'CLUSTERDOWN The cluster is down'. \n🛠️ Cách fix: Kiểm tra trạng thái các node trong cluster và đảm bảo số lượng master node tối thiểu vẫn hoạt động. 🏗️" },
//   { "content": "🛡️ [Security] Lỗi 'Insecure Deserialization' khi dùng thư viện node-serialize. \n🛠️ Cách fix: Tránh deserialize dữ liệu từ người dùng hoặc chuyển sang dùng JSON.parse() an toàn hơn. 🔐" },
//   { "content": "⚡ [Node.js] Lỗi 'ERR_HTTP2_GOAWAY_SESSION' trong kết nối HTTP/2. \n🛠️ Cách fix: Triển khai cơ chế tự động khởi tạo lại session khi nhận được tín hiệu GOAWAY từ server. 📡" },
//   { "content": "📦 [Docker] Lỗi 'Failed to compute cache key' khi build image. \n🛠️ Cách fix: Kiểm tra đường dẫn trong file Dockerfile và đảm bảo các file trong .dockerignore không bị gọi nhầm. 📂" },
//   { "content": "🔑 [OAuth2] Lỗi 'state mismatch' khi thực hiện callback. \n🛠️ Cách fix: Đảm bảo session lưu trữ 'state' không bị thay đổi hoặc hết hạn giữa lúc gửi và lúc nhận callback. 🛡️" },
//   { "content": "💾 [MongoDB] Lỗi 'Transaction numbers are only allowed on a replica set member'. \n🛠️ Cách fix: Chuyển Database từ Standalone sang mô hình Replica Set để hỗ trợ các giao dịch (Transactions). 💾" },
//   { "content": "🏗️ [TypeORM] Lỗi 'QueryFailedError: column X of relation Y does not exist'. \n🛠️ Cách fix: Chạy lại migration hoặc kiểm tra xem entity và table đã đồng bộ (synchronize) chưa. 🗃️" },
//   { "content": "🧬 [TypeScript] Lỗi 'Overload signature is not compatible with implementation'. \n🛠️ Cách fix: Kiểm tra lại các tham số trong hàm thực thi, đảm bảo bao phủ được tất cả các trường hợp overload. 🛠️" },
//   { "content": "📉 [Performance] CPU spike 100% do xử lý Regex quá phức tạp (ReDoS). \n🛠️ Cách fix: Tối ưu lại biểu thức Regex hoặc sử dụng thư viện safe-regex để kiểm tra trước khi chạy. 🧊" },
//   { "content": "📞 [Microservices] Lỗi 'Message too large' khi dùng gRPC. \n🛠️ Cách fix: Tăng giá trị maxReceiveMessageSize hoặc chia nhỏ dữ liệu thành các stream (gRPC Streaming). 📞" },
//   { "content": "🔀 [Express] Lỗi 'Proxy error: Could not proxy request'. \n🛠️ Cách fix: Kiểm tra service backend đang chạy trên port nào và cấu hình proxy (target) có chính xác không. 🌐" },
//   { "content": "📜 [NestJS] Lỗi 'Cannot find module path alias' sau khi build sang JS. \n🛠️ Cách fix: Cài đặt package 'tsconfig-paths' và require nó trong file main.js để giải quyết alias. 🏗️" },
//   { "content": "🛠️ [DevOps] Lỗi 'Zombie process' làm cạn kiệt bảng process hệ thống. \n🛠️ Cách fix: Đảm bảo process cha handle được tín hiệu SIGCHLD hoặc dùng dumb-init trong Docker. 🧟" },
//   { "content": "📡 [Socket.io] Lỗi 'client not joined room' dù đã gọi hàm join. \n🛠️ Cách fix: Kiểm tra tính bất đồng bộ, đảm bảo socket đã thực sự kết nối trước khi thực hiện join room. 🔌" },
//   { "content": "🧊 [Node.js] Lỗi 'ERR_METHOD_NOT_IMPLEMENTED'. \n🛠️ Cách fix: Kiểm tra class con đã override đầy đủ các method abstract của class cha chưa. 🧱" },
//   { "content": "🗄️ [Postgres] Lỗi 'Too many clients already' khi dùng psql. \n🛠️ Cách fix: Sử dụng Connection Pooling (như pg-pool hoặc PgBouncer) thay vì tạo kết nối mới cho mỗi request. 🚰" },
//   { "content": "🧪 [Jest] Lỗi 'Cannot use import statement outside a module'. \n🛠️ Cách fix: Cấu hình Babel hoặc ts-jest để transform code trước khi thực hiện test. 🧪" },
//   { "content": "🔌 [Mongoose] Lỗi 'MongooseServerSelectionError'. \n🛠️ Cách fix: Kiểm tra whitelist IP trên MongoDB Atlas hoặc firewall của server có chặn port 27017 không. 🔌" },
//   { "content": "🛠️ [NPM] Lỗi 'npm ERR! code EINTEGRITY'. \n🛠️ Cách fix: Xóa file package-lock.json và folder node_modules rồi chạy 'npm install' lại. 📦" },
//   { "content": "🚀 [Kubernetes] Lỗi 'CrashLoopBackOff' liên tục. \n🛠️ Cách fix: Kiểm tra log của pod bằng lệnh 'kubectl logs', thường do thiếu biến môi trường hoặc file config. 🎡" },
//   { "content": "🔥 [Firebase] Lỗi 'Too nhiều index' làm write operation bị fail. \n🛠️ Cách fix: Tối ưu lại cấu trúc query và xóa bớt các index không cần thiết trong Firebase Console. 🔥" },
//   { "content": "🔧 [NestJS] Lỗi 'Unknown request mapping' (404). \n🛠️ Cách fix: Kiểm tra xem Controller đã được khai báo đúng @Controller('path') và đã có trong Module chưa. 🗺️" },
//   { "content": "🛑 [Node.js] Lỗi 'ERR_STREAM_CANNOT_PIPE'. \n🛠️ Cách fix: Kiểm tra xem stream đích có thể ghi (writable) không và đảm bảo stream nguồn chưa bị đóng. ⚙️" },
//   { "content": "🌐 [Axios] Lỗi 'Maximum redirect count exceeded'. \n🛠️ Cách fix: Kiểm tra URL redirect có bị lặp vòng (loop) không và giới hạn lại thuộc tính maxRedirects. 🔄" },
//   { "content": "🏗️ [Webpack] Lỗi 'Invalid configuration object'. \n🛠️ Cách fix: Kiểm tra lại syntax trong file webpack.config.js, thường do sai tên thuộc tính của phiên bản mới. 🛠️" },
//   { "content": "🛡️ [Auth] Lỗi 'Missing credentials' khi dùng Passport-Local. \n🛠️ Cách fix: Đảm bảo tên trường (usernameField/passwordField) trong config khớp với body gửi lên. 🔑" },
//   { "content": "📊 [ELK] Lỗi 'CircuitBreakerException' trong Elasticsearch. \n🛠️ Cách fix: Tăng RAM cho JVM hoặc giảm bớt khối lượng dữ liệu truy vấn trong một lần (batch size). 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Standard_init_linux.go:211: exec user process caused \"no such file or directory\"'. \n🛠️ Cách fix: Chuyển line ending của file entrypoint.sh từ CRLF sang LF. 🐧" },
//   { "content": "⚙️ [Linux] Lỗi 'Write error: No space left on device' dù đĩa vẫn báo trống. \n🛠️ Cách fix: Kiểm tra Inodes bằng lệnh 'df -i', có thể do quá nhiều file nhỏ làm hết index của filesystem. 📁" },
//   { "content": "🌀 [Redis] Lỗi 'LOADING Redis is loading the dataset in memory'. \n🛠️ Cách fix: Chờ Redis nạp xong dữ liệu từ file RDB/AOF vào RAM trước khi thực hiện query. ⏳" },
//   { "content": "💉 [SQL] Lỗi 'Out of range value for column'. \n🛠️ Cách fix: Kiểm tra kiểu dữ liệu (INT vs BIGINT), dữ liệu truyền vào đang vượt quá giới hạn của cột. 📏" },
//   { "content": "📦 [Yarn] Lỗi 'There appears to be trouble with your network connection'. \n🛠️ Cách fix: Kiểm tra cấu hình registry của yarn hoặc dùng 'yarn install --network-timeout 100000'. 🌐" },
//   { "content": "🧩 [Mongoose] Lỗi 'ParallelSaveError'. \n🛠️ Cách fix: Tránh gọi .save() nhiều lần trên cùng một document trong cùng một thời điểm. 🛑" },
//   { "content": "🔐 [Crypto] Lỗi 'Digital envelope routines: unsupported'. \n🛠️ Cách fix: Do Node.js 17+ dùng OpenSSL 3, hãy sử dụng flag --openssl-legacy-provider nếu cần tương thích cũ. 🔐" },
//   { "content": "🚦 [RateLimit] Lỗi 'Rate limit key missing'. \n🛠️ Cách fix: Đảm bảo middleware lấy được IP của client (kiểm tra trust proxy nếu đứng sau Nginx). 🚦" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Cannot use connection 'default' because it was not found'. \n🛠️ Cách fix: Đảm bảo DataSource đã được khởi tạo (initialize) thành công trước khi truy cập. 🏗️" },
//   { "content": "☁️ [AWS] Lỗi 'SignatureDoesNotMatch' khi gọi S3 API. \n🛠️ Cách fix: Kiểm tra lại Access Key, Secret Key và đảm bảo thời gian hệ thống đồng bộ với thời gian thực. ☁️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Invalid class, @Injectable() decorator is missing'. \n🛠️ Cách fix: Tất cả các Provider hoặc Service được inject vào constructor đều phải có decorator @Injectable(). 🧩" },
//   { "content": "📝 [Pino] Lỗi 'Dest already closed'. \n🛠️ Cách fix: Đảm bảo logger chưa bị destroy trước khi thực hiện ghi log async. 📝" },
//   { "content": "🧪 [Playwright] Lỗi 'Browser closed'. \n🛠️ Cách fix: Kiểm tra xem có lệnh browser.close() nào chạy sớm hơn dự kiến hoặc crash do thiếu RAM. 🧪" },
//   { "content": "🔧 [Prettier] Lỗi 'Invalid option for rule'. \n🛠️ Cách fix: Cập nhật file .prettierrc theo đúng schema của phiên bản hiện tại đang dùng. 🔧" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Unknown constraint error'. \n🛠️ Cách fix: Kiểm tra tên ràng buộc (constraint) trong DB, có thể nó đã bị đổi tên hoặc xóa thủ công. 🗃️" },
//   { "content": "🛡️ [TLS] Lỗi 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'. \n🛠️ Cách fix: Cài đặt đầy đủ chuỗi chứng chỉ (Certificate Chain) bao gồm cả Intermediate CA. 🛡️" },
//   { "content": "🌐 [Nginx] Lỗi '413 Request Entity Too Large'. \n🛠️ Cách fix: Tăng giá trị client_max_body_size trong file cấu hình nginx.conf. 📂" },
//   { "content": "🚀 [PM2] Lỗi 'Port in use' sau khi restart. \n🛠️ Cách fix: Dùng 'pm2 delete all' sau đó khởi động lại, hoặc kiểm tra process chạy ngầm chưa bị kill. ⚙️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_ASSERT_SNAPSHOT_NOT_FOUND'. \n🛠️ Cách fix: Kiểm tra lại file snapshot của unit test, có thể nó chưa được tạo hoặc đường dẫn bị sai. 🧪" },
//   { "content": "📦 [K8s] Lỗi 'Invalid ImagePullPolicy'. \n🛠️ Cách fix: Kiểm tra syntax trong file yaml, đảm bảo dùng Always, IfNotPresent hoặc Never. 🎡" },
//   { "content": "🧩 [NestJS] Lỗi 'Interceptors không hoạt động'. \n🛠️ Cách fix: Đảm bảo Interceptor đã được bind đúng cấp (Global, Controller hoặc Method). 🧩" },
//   { "content": "💾 [Redis] Lỗi 'CROSSSLOT Keys in request don't hash to the same slot'. \n🛠️ Cách fix: Sử dụng hashtag {} trong key để đảm bảo các key liên quan nằm trên cùng một shard. 💾" },
//   { "content": "🛡️ [JWT] Lỗi 'jwt audience invalid'. \n🛠️ Cách fix: Kiểm tra field 'aud' trong payload có khớp với cấu hình verify audience không. 🛡️" },
//   { "content": "🔀 [Git] Lỗi 'fatal: refusing to merge unrelated histories'. \n🛠️ Cách fix: Thêm flag --allow-unrelated-histories khi thực hiện merge hai repo khác gốc. 🔀" },
//   { "content": "🧱 [Docker] Lỗi 'Error grabbing logs: EOF'. \n🛠️ Cách fix: Thường do container crash quá nhanh, hãy dùng docker-compose up để xem log realtime. 🧱" },
//   { "content": "📡 [Apollo] Lỗi 'Response not successful: 400'. \n🛠️ Cách fix: Kiểm tra lại query GraphQL gửi lên, có thể thiếu field bắt buộc hoặc sai kiểu dữ liệu. 📡" },
//   { "content": "🧪 [Chai] Lỗi 'expect(...).to.be.a is not a function'. \n🛠️ Cách fix: Đảm bảo đã require chai và sử dụng đúng interface (should, expect hoặc assert). 🧪" },
//   { "content": "🔧 [TS] Lỗi 'Duplicate identifier'. \n🛠️ Cách fix: Kiểm tra xem có file nào định nghĩa cùng một Type/Interface hai lần trong cùng một scope không. 🔧" },
//   { "content": "🏗️ [NestJS] Lỗi 'Microservice timeout'. \n🛠️ Cách fix: Tăng thời gian chờ timeout trong cấu hình client hoặc kiểm tra kết nối mạng giữa các service. 🏗️" },
//   { "content": "🗃️ [Knex] Lỗi 'Undefined binding'. \n🛠️ Cách fix: Kiểm tra số lượng tham số trong câu query where(?), số lượng giá trị truyền vào phải khớp với số dấu chấm hỏi. 🗃️" },
//   { "content": "🔌 [Socket.io] Lỗi 'xhr poll error'. \n🛠️ Cách fix: Kiểm tra CORS hoặc cấu hình lại transports thành ['websocket', 'polling'] để tăng độ ổn định. 🔌" },
//   { "content": "🛡️ [Bcrypt] Lỗi 'Salt is too short'. \n🛠️ Cách fix: Sử dụng hàm bcrypt.genSalt() với rounds >= 10 để đảm bảo độ an toàn. 🔐" },
//   { "content": "📂 [Fs] Lỗi 'EISDIR: illegal operation on a directory'. \n🛠️ Cách fix: Bạn đang dùng fs.readFile cho một thư mục, hãy kiểm tra lại đường dẫn file. 📂" },
//   { "content": "🚀 [Vercel] Lỗi 'Exceeded unzipped size limit'. \n🛠️ Cách fix: Giảm bớt các package không cần thiết trong node_modules hoặc dùng npx depcheck để lọc. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'App.use() requires a middleware function'. \n🛠️ Cách fix: Kiểm tra các middleware tùy chỉnh, đảm bảo luôn trả về một function (req, res, next). ⚙️" },
//   { "content": "🧩 [NestJS] Lỗi 'Exception filter not catching errors'. \n🛠️ Cách fix: Đảm bảo filter đã được đăng ký bằng @UseFilters() và throw đúng class Exception. 🧩" },
//   { "content": "🛡️ [Helmet] Lỗi 'X-Frame-Options: deny'. \n🛠️ Cách fix: Cấu hình lại frameguard trong helmet nếu bạn muốn cho phép app hiển thị trong iframe (như CMS). 🛡️" },
//   { "content": "🧪 [Supertest] Lỗi 'Address already in use'. \n🛠️ Cách fix: Đảm bảo server test đóng kết nối bằng app.close() sau mỗi test case. 🧪" },
//   { "content": "🔧 [NestJS] Lỗi 'Circular Dependency in Modules'. \n🛠️ Cách fix: Kiểm tra vòng lặp import giữa Module A và Module B, sử dụng forwardRef() trong mảng imports. 🔄" },
//   { "content": "📊 [Datadog] Lỗi 'Agent unable to reach API'. \n🛠️ Cách fix: Kiểm tra API Key và cấu hình firewall cho phép outbound traffic tới Datadog. 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Step X/Y : RUN npm install failed'. \n🛠️ Cách fix: Thường do lỗi mạng hoặc registry npm bị sập, hãy thử dùng cache image hoặc chạy lại build. 🧱" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_HEADERS_SENT'. \n🛠️ Cách fix: Một request chỉ được phản hồi một lần, kiểm tra xem có res.send() nào nằm ngoài logic điều kiện không. 🛑" },
//   { "content": "📡 [Kafka] Lỗi 'Leader not available'. \n🛠️ Cách fix: Chờ Kafka leader election xong hoặc kiểm tra trạng thái của Zookeeper/Controller. 📡" },
//   { "content": "🗄️ [Mongoose] Lỗi 'Validation failed: Path is required'. \n🛠️ Cách fix: Dữ liệu gửi lên thiếu các field bắt buộc đã định nghĩa trong Schema. 💾" },
//   { "content": "🧪 [Jest] Lỗi 'Async callback was not invoked within timeout'. \n🛠️ Cách fix: Tăng jest.setTimeout() hoặc kiểm tra xem hàm async có bị treo (infinite loop) không. ⏳" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Naming strategy not found'. \n🛠️ Cách fix: Cấu hình lại snakeNamingStrategy nếu bạn muốn tự động map camelCase sang snake_case. 🏗️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Unsupported Media Type (415)'. \n🛠️ Cách fix: Kiểm tra header Content-Type gửi từ client, NestJS mặc định yêu cầu application/json. 🛡️" },
//   { "content": "🌀 [Redis] Lỗi 'No matching script found in cache'. \n🛠️ Cách fix: Do lệnh EVALSHA thất bại, hãy fallback về lệnh EVAL để nạp lại script vào Redis. 🌀" },
//   { "content": "🛡️ [Passport] Lỗi 'User not found in request'. \n🛠️ Cách fix: Đảm bảo passport.initialize() chạy trước router và user đã login thành công. 🔐" },
//   { "content": "📦 [NPM] Lỗi 'ERESOLVE unable to resolve dependency tree'. \n🛠️ Cách fix: Sử dụng flag --legacy-peer-deps để ép cài đặt các package có xung đột nhỏ về version. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'Cookie not being set'. \n🛠️ Cách fix: Nếu dùng HTTPS, hãy check option 'secure: true'. Nếu dùng domain khác, check 'sameSite: none'. 🍪" },
//   { "content": "🔌 [Mongoose] Lỗi 'MissingSchemaError'. \n🛠️ Cách fix: Đảm bảo model đã được khởi tạo bằng mongoose.model('Name', Schema) trước khi sử dụng. 🔌" },
//   { "content": "🛡️ [CORS] Lỗi 'Vary: Origin' header. \n🛠️ Cách fix: Đảm bảo middleware CORS trả về đúng header để browser cache các kết quả preflight. 🛡️" },
//   { "content": "🚀 [Heroku] Lỗi 'H12 (Request timeout)'. \n🛠️ Cách fix: Tối ưu hóa các tác vụ nặng (nén ảnh, xử lý video) bằng cách đẩy sang background job (Worker). 🚀" },
//   { "content": "📂 [Multer] Lỗi 'File too large'. \n🛠️ Cách fix: Tăng giới hạn fileSize trong cấu hình limits của Multer. 📂" },
//   { "content": "🧪 [Jest] Lỗi 'Spy was not called'. \n🛠️ Cách fix: Kiểm tra xem function thực tế có được trigger hay không, hoặc spy đã gắn đúng method chưa. 🧪" },
//   { "content": "🔧 [TypeScript] Lỗi 'Type is not assignable to type never'. \n🛠️ Cách fix: Thường do logic check type bị thu hẹp quá mức, hãy kiểm tra lại các câu lệnh switch/case hoặc if. 🔧" },
//   { "content": "🏗️ [NestJS] Lỗi 'Cannot read property X of undefined' trong Service. \n🛠️ Cách fix: Kiểm tra xem Service đó đã được inject đúng chưa hay đang gọi trực tiếp từ class. 🏗️" },
//   { "content": "🗃️ [Postgres] Lỗi 'String data, right truncation'. \n🛠️ Cách fix: Dữ liệu chuỗi quá dài so với giới hạn VARCHAR(n) trong định nghĩa cột. 📏" },
//   { "content": "📡 [GraphQL] Lỗi 'Variable X of non-null type Y! must not be null'. \n🛠️ Cách fix: Đảm bảo các biến bắt buộc đã được truyền giá trị từ phía frontend. 📡" },
//   { "content": "🛡️ [Argon2] Lỗi 'Internal argon2 error'. \n🛠️ Cách fix: Đảm bảo node-gyp và các công cụ build C++ đã được cài đặt để compile thư viện. ⚙️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_REQUEST_TIMEOUT'. \n🛠️ Cách fix: Tăng giá trị server.timeout nếu ứng dụng cần xử lý các request tốn nhiều thời gian. ⏳" },
//   { "content": "📦 [Docker] Lỗi 'Container is not running'. \n🛠️ Cách fix: Dùng 'docker inspect' để xem lý do container bị stop (OOM, lỗi code, thiếu env). 🧱" },
//   { "content": "🧪 [Mocha] Lỗi 'Done() called multiple times'. \n🛠️ Cách fix: Đảm bảo callback done() chỉ được gọi một lần duy nhất trong hàm test async. 🧪" },
//   { "content": "🛠️ [NestJS] Lỗi 'Reflect-metadata is missing'. \n🛠️ Cách fix: Phải import 'reflect-metadata' ở dòng ĐẦU TIÊN của file main.ts. 🛠️" },
//   { "content": "🌐 [Axios] Lỗi 'Unexpected end of file'. \n🛠️ Cách fix: Thường do kết nối mạng bị đứt giữa chừng, hãy check đường truyền hoặc dùng stream. 📡" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Database is locked'. \n🛠️ Cách fix: (Thường gặp ở SQLite) Đóng các connection cũ hoặc giảm bớt các transaction ghi đồng thời. 🗃️" },
//   { "content": "🛡️ [XSS] Lỗi 'Inline script execution blocked'. \n🛠️ Cách fix: Cấu hình CSP (Content Security Policy) để cho phép mã băm (hash) hoặc nonce cho script nội bộ. 🛡️" },
//   { "content": "⚙️ [Linux] Lỗi 'Too many open files' (Error 24). \n🛠️ Cách fix: Sử dụng 'ulimit -n' để tăng giới hạn số lượng file descriptor hệ thống có thể mở. ⚙️" }
// ]

// const tweets = [
//   { "content": "🚨 [Node.js] Lỗi 'ERR_HTTP_INVALID_CHAR' trong tiêu đề (Header). \n🛠️ Cách fix: Kiểm tra và loại bỏ các ký tự đặc biệt hoặc ký tự Unicode không hợp lệ khỏi res.setHeader(). ❌" },
//   { "content": "🔍 [ExpressJS] Lỗi 'Route.post() requires callback functions but got a [object Undefined]'. \n🛠️ Cách fix: Kiểm tra xem file Controller đã export function đúng cách chưa, hay đang import nhầm tên hàm. 📂" },
//   { "content": "🛠️ [NestJS] Lỗi 'Cannot read property 'get' of undefined' khi dùng ConfigService. \n🛠️ Cách fix: Đảm bảo đã imports ConfigModule.forRoot() vào AppModule trước khi inject ConfigService. ⚙️" },
//   { "content": "💡 [Mongoose] Lỗi 'OverwriteModelError: Cannot overwrite model once compiled'. \n🛠️ Cách fix: Kiểm tra xem có đang khởi tạo model 2 lần không, dùng: mongoose.models.User || mongoose.model('User', schema). 🔄" },
//   { "content": "🚀 [Redis] Lỗi 'WRONGTYPE Operation against a key holding the wrong kind of value'. \n🛠️ Cách fix: Bạn đang dùng lệnh của String cho một Key chứa List/Set, hãy kiểm tra kiểu dữ liệu bằng lệnh TYPE. 🔢" },
//   { "content": "🛡️ [Security] Lỗi 'CSRF token missing or incorrect'. \n🛠️ Cách fix: Đảm bảo phía frontend đã gửi kèm X-CSRF-Token trong header và backend đã cấu hình csurf middleware. 🔑" },
//   { "content": "⚡ [Node.js] Lỗi 'ERR_DLOPEN_FAILED' khi require thư viện C++ (native addon). \n🛠️ Cách fix: Chạy 'npm rebuild' để biên dịch lại thư viện phù hợp với phiên bản Node.js hiện tại của máy. 🛠️" },
//   { "content": "📦 [Docker] Lỗi 'no route to host' khi container gọi ra ngoài. \n🛠️ Cách fix: Kiểm tra cấu hình iptables của máy host hoặc dùng mode network 'host' nếu cần thiết. 🌐" },
//   { "content": "🔑 [Firebase] Lỗi 'ID token has expired'. \n🛠️ Cách fix: Phía frontend cần bắt lỗi này để gọi hàm getIdToken(true) nhằm làm mới token trước khi gọi API. ⏳" },
//   { "content": "💾 [Postgres] Lỗi 'current transaction is aborted, commands ignored until end of transaction block'. \n🛠️ Cách fix: Khi một lệnh trong transaction bị lỗi, bạn phải ROLLBACK trước khi có thể thực hiện lệnh mới. 🔄" },
//   { "content": "🏗️ [TypeORM] Lỗi 'NamingStrategyNotFoundError'. \n🛠️ Cách fix: Đảm bảo class NamingStrategy của bạn được export đúng và đã đăng ký trong DataSource options. 🏷️" },
//   { "content": "🧬 [TypeScript] Lỗi 'Type instantiation is excessively deep and possibly infinite'. \n🛠️ Cách fix: Đơn giản hóa các kiểu dữ liệu lồng nhau (Recursive Types) hoặc dùng kỹ thuật 'as any' để ngắt mạch. 🧬" },
//   { "content": "📉 [Performance] Event Loop Lag tăng cao do dùng JSON.parse() với object cực lớn. \n🛠️ Cách fix: Sử dụng thư viện stream-json để parse dữ liệu theo luồng thay vì load toàn bộ vào RAM. 📉" },
//   { "content": "📞 [Microservices] Lỗi 'NATS: Connection timeout'. \n🛠️ Cách fix: Kiểm tra địa chỉ NATS server và đảm bảo firewall không chặn port 4222. 📡" },
//   { "content": "🔀 [Express] Lỗi 'req.query trả về [object Object] thay vì value'. \n🛠️ Cách fix: Kiểm tra xem bạn có đang dùng qs library không và cấu hình 'extended: true' trong urlencoded. ⚙️" },
//   { "content": "📜 [NestJS] Lỗi 'Circular dependency between modules' (Module A -> Module B -> Module A). \n🛠️ Cách fix: Sử dụng forwardRef() trong mảng imports của cả 2 Module để giải quyết vòng lặp. 🔄" },
//   { "content": "🛠️ [DevOps] Lỗi 'Resource temporarily unavailable' (EAGAIN). \n🛠️ Cách fix: Hệ thống hết số lượng thread/process cho user đó, hãy tăng giới hạn nproc trong /etc/security/limits.conf. ⚙️" },
//   { "content": "📡 [Socket.io] Lỗi 'Multiple transports không đồng bộ'. \n🛠️ Cách fix: Ép client chỉ dùng ['websocket'] để tránh lỗi khi upgrade từ polling lên websocket thất bại. 🔌" },
//   { "content": "🧊 [Node.js] Lỗi 'ERR_ASYNC_TYPE_INVALID'. \n🛠️ Cách fix: Kiểm tra tham số truyền vào AsyncLocalStorage, đảm bảo đúng định dạng yêu cầu của Node.js. 🧊" },
//   { "content": "🗄️ [MySQL] Lỗi 'Lock wait timeout exceeded'. \n🛠️ Cách fix: Tối ưu query để kết thúc transaction nhanh hơn hoặc tăng biến innodb_lock_wait_timeout. ⏳" },
//   { "content": "🧪 [Jest] Lỗi 'cannot find module' dù file vẫn tồn tại. \n🛠️ Cách fix: Kiểm tra moduleDirectories hoặc moduleNameMapper trong file jest.config.js. 🧪" },
//   { "content": "🔌 [MongoDB] Lỗi 'Cursor not found' khi loop qua mảng lớn. \n🛠️ Cách fix: Tăng cursor timeout hoặc chia nhỏ batch size khi thực hiện query bằng .batchSize(100). 💾" },
//   { "content": "🛠️ [NPM] Lỗi 'ERESOLVE: Could not resolve dependency tree'. \n🛠️ Cách fix: Thêm flag --force hoặc --legacy-peer-deps để cài đặt các package bị xung đột version nhẹ. 📦" },
//   { "content": "🚀 [AWS] Lỗi 'Lambda Runtime.ExitError' (Signal: killed). \n🛠️ Cách fix: Lambda bị tràn bộ nhớ (OOM), hãy tăng cấu hình Memory trong AWS Console. 🧠" },
//   { "content": "🔥 [Firebase] Lỗi 'Too many concurrent connections'. \n🛠️ Cách fix: Nâng cấp gói trả phí hoặc tối ưu lại việc đóng kết nối Realtime Database khi không sử dụng. 🔥" },
//   { "content": "🔧 [NestJS] Lỗi 'Swagger: Duplicate model name'. \n🛠️ Cách fix: Đặt tên class DTO khác nhau hoặc dùng @Schema({ title: 'UniqueName' }) để Swagger phân biệt. 📝" },
//   { "content": "🛑 [Node.js] Lỗi 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM'. \n🛠️ Cách fix: Tính năng này chỉ chạy trên Linux/macOS, hãy kiểm tra hệ điều hành trước khi gọi hàm. 🐧" },
//   { "content": "🌐 [Axios] Lỗi 'Zlib: unexpected end of file'. \n🛠️ Cách fix: Header 'accept-encoding' yêu cầu nén nhưng dữ liệu trả về bị lỗi, hãy thử tắt nén (gzip: false). 📉" },
//   { "content": "🏗️ [Webpack] Lỗi 'Can't resolve 'fs' in frontend'. \n🛠️ Cách fix: Thêm cấu hình resolve.fallback: { fs: false } vì trình duyệt không có module quản lý file. 🛠️" },
//   { "content": "🛡️ [Auth] Lỗi 'Refresh token reuse detected'. \n🛠️ Cách fix: Triển khai 'Refresh Token Rotation', vô hiệu hóa toàn bộ family token nếu phát hiện reuse trái phép. 🔐" },
//   { "content": "📊 [Elasticsearch] Lỗi 'cluster_block_exception' (read-only allow delete). \n🛠️ Cách fix: Ổ đĩa server bị đầy (>95%), hãy xóa log hoặc tăng dung lượng đĩa rồi set index.blocks.read_only_allow_delete về null. 💾" },
//   { "content": "🧱 [Docker] Lỗi 'manifest for image not found on this platform'. \n🛠️ Cách fix: Image không hỗ trợ chip (ví dụ M1/M2), hãy dùng flag --platform linux/amd64 khi pull/build. 🏗️" },
//   { "content": "⚙️ [Linux] Lỗi 'No space left on device' dù df -h báo còn trống. \n🛠️ Cách fix: Kiểm tra Inodes bằng lệnh 'df -i', nếu 100% thì do quá nhiều file nhỏ, hãy xóa các file temp/session. 📁" },
//   { "content": "🌀 [Redis] Lỗi 'NOAUTH Authentication required'. \n🛠️ Cách fix: Bạn chưa gọi lệnh AUTH hoặc chưa truyền password vào connection string (redis://:password@host). 🔑" },
//   { "content": "💉 [SQL] Lỗi 'Data truncation: Data too long for column'. \n🛠️ Cách fix: Tăng độ dài kiểu dữ liệu (ví dụ từ VARCHAR(50) lên VARCHAR(255)) trong database. 📏" },
//   { "content": "📦 [Yarn] Lỗi 'error An unexpected error occurred: https://registry.yarnpkg.com/...'. \n🛠️ Cách fix: Chạy 'yarn config set registry https://registry.npmjs.org/' để đổi mirror tải package. 🌐" },
//   { "content": "🧩 [Mongoose] Lỗi 'VersionError' khi save document. \n🛠️ Cách fix: Tài liệu đã bị thay đổi bởi process khác, hãy fetch lại bản mới nhất trước khi thực hiện update. 🛑" },
//   { "content": "🔐 [Bcrypt] Lỗi 'Illegal arguments: string, undefined'. \n🛠️ Cách fix: Đảm bảo biến password và hash_password đều tồn tại trước khi dùng hàm compare(). 🔐" },
//   { "content": "🚦 [RateLimit] Lỗi 'Rate limiters do not share state'. \n🛠️ Cách fix: Nếu chạy đa server, hãy dùng redis-store cho rate limiter để đồng bộ số lượng request giữa các node. 🚦" },
//   { "content": "🏗️ [TypeORM] Lỗi 'ConnectionNotFoundError: Connection \"default\" was not found'. \n🛠️ Cách fix: Kiểm tra xem đã gọi DataSource.initialize() chưa hoặc tên connection trong @InjectRepository() có khớp không. 🏗️" },
//   { "content": "☁️ [AWS S3] Lỗi '403 Forbidden' khi truy cập file. \n🛠️ Cách fix: Kiểm tra 'Block Public Access' và Bucket Policy, đảm bảo đã cấp quyền s3:GetObject. ☁️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Class X is not a provider!'. \n🛠️ Cách fix: Kiểm tra xem class X đã có decorator @Injectable() chưa và đã được liệt kê trong mảng providers của module chưa. 🧩" },
//   { "content": "📝 [Winston] Lỗi 'Maximum call stack size exceeded' khi log object vòng lặp. \n🛠️ Cách fix: Sử dụng format.json() hoặc một hàm util để dọn dẹp các circular reference trước khi log. 📝" },
//   { "content": "🧪 [Cypress] Lỗi 'cy.click() failed because this element is being covered by another element'. \n🛠️ Cách fix: Dùng { force: true } hoặc đảm bảo các modal/overlay đã đóng trước khi click. 🧪" },
//   { "content": "🔧 [ESLint] Lỗi 'Unexpected template string expression' (no-template-curly-in-string). \n🛠️ Cách fix: Bạn đang dùng '${}' trong chuỗi thường dùng dấu nháy đơn/kép, hãy đổi sang backtick ( ` ). 🔧" },
//   { "content": "🗄️ [Sequelize] Lỗi 'AggregateError [SequelizeConnectionError]'. \n🛠️ Cách fix: Kiểm tra lại username, password và host trong cấu hình, đảm bảo DB đang mở cổng nhận kết nối. 🗃️" },
//   { "content": "🛡️ [OpenSSL] Lỗi 'Error: error:0308010C:digital envelope routines::unsupported'. \n🛠️ Cách fix: Đây là lỗi Node.js 17-20, hãy set biến môi trường NODE_OPTIONS=--openssl-legacy-provider. 🛡️" },
//   { "content": "🌐 [Nginx] Lỗi 'Worker_connections are not enough'. \n🛠️ Cách fix: Tăng worker_connections trong file nginx.conf (ví dụ lên 1024 hoặc 2048). 🌐" },
//   { "content": "🚀 [PM2] Lỗi 'Change detected, restarting' (loop). \n🛠️ Cách fix: Kiểm tra xem app có ghi file vào thư mục đang được pm2 watch không, dùng mảng 'ignore_watch' để loại bỏ. ⚙️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_INVALID_HEADER_VALUE'. \n🛠️ Cách fix: Kiểm tra xem có giá trị undefined hoặc null nào bị truyền vào header không. ❌" },
//   { "content": "📦 [Kubernetes] Lỗi 'CreateContainerConfigError'. \n🛠️ Cách fix: Thường do thiếu ConfigMap hoặc Secret, hãy check kubectl mô tả pod để xem tài nguyên nào bị thiếu. 🎡" },
//   { "content": "🧩 [NestJS] Lỗi 'Request timeout (408)'. \n🛠️ Cách fix: Tăng thời gian timeout trong Interceptor hoặc kiểm tra các database query chạy quá lâu. ⏳" },
//   { "content": "💾 [Redis] Lỗi 'MOVED 1234 127.0.0.1:6379'. \n🛠️ Cách fix: Bạn đang kết nối tới Cluster mà không dùng chế độ 'cluster mode', hãy đổi thư viện sang hỗ trợ Redis Cluster. 💾" },
//   { "content": "🛡️ [JWT] Lỗi 'jwt signature is required'. \n🛠️ Cách fix: Token gửi lên bị thiếu phần signature (sau dấu chấm thứ 2), kiểm tra lại phía client gửi token. 🛡️" },
//   { "content": "🔀 [Git] Lỗi 'Rebase conflict'. \n🛠️ Cách fix: Sửa code bị conflict, dùng 'git add .' và sau đó 'git rebase --continue' thay vì commit. 🔀" },
//   { "content": "🧱 [Docker] Lỗi 'failed to solve with frontend dockerfile.v0'. \n🛠️ Cách fix: Bật BuildKit bằng cách set DOCKER_BUILDKIT=1 trước khi chạy lệnh build image. 🧱" },
//   { "content": "📡 [GraphQL] Lỗi 'Must provide query string'. \n🛠️ Cách fix: Kiểm tra body gửi lên, đảm bảo có field 'query' và nó không bị rỗng. 📡" },
//   { "content": "🧪 [Mocha] Lỗi 'this.timeout is not a function'. \n🛠️ Cách fix: Bạn đang dùng arrow function (=>), hãy đổi sang 'function()' truyền thống để giữ context của Mocha. 🧪" },
//   { "content": "🔧 [TS] Lỗi 'Property X is used before being assigned'. \n🛠️ Cách fix: Khởi tạo giá trị mặc định cho biến hoặc dùng toán tử '!' (non-null assertion) nếu chắc chắn nó sẽ có giá trị. ✅" },
//   { "content": "🏗️ [NestJS] Lỗi 'WebSocket is not a constructor'. \n🛠️ Cách fix: Kiểm tra version socket.io và @nestjs/websockets, đảm bảo chúng tương thích với nhau. 🔌" },
//   { "content": "🗃️ [Knex] Lỗi 'Already has a query'. \n🛠️ Cách fix: Bạn đang cố tái sử dụng một đối tượng query đã thực thi, hãy tạo query mới cho mỗi lần gọi. 🗃️" },
//   { "content": "🔌 [Socket.io] Lỗi 'Invalid frame header'. \n🛠️ Cách fix: Thường do lỗi proxy (như Cloudflare hoặc Nginx) xử lý không đúng gói tin WebSocket, hãy check cấu hình buffer. 🔌" },
//   { "content": "🛡️ [Bcrypt] Lỗi 'Rounds must be a number'. \n🛠️ Cách fix: Đảm bảo tham số saltRounds truyền vào là số (ví dụ: 10), không phải là chuỗi '10'. 🔐" },
//   { "content": "📂 [Fs] Lỗi 'EMFILE: too many open files'. \n🛠️ Cách fix: Đóng các file sau khi xử lý hoặc dùng thư viện 'graceful-fs' để tự động quản lý file descriptor. 📂" },
//   { "content": "🚀 [Vercel] Lỗi 'Serverless Function has crashed'. \n🛠️ Cách fix: Kiểm tra log trên Dashboard của Vercel, thường do lỗi logic code hoặc biến môi trường chưa được set. 🚀" },
//   { "content": "⚙️ [Express] Lỗi 'Cannot redirect after headers sent'. \n🛠️ Cách fix: Luôn dùng 'return res.redirect()' để đảm bảo không có code nào chạy phía sau lệnh redirect. 🛑" },
//   { "content": "🧩 [NestJS] Lỗi 'Module not found (Local)'. \n🛠️ Cách fix: Kiểm tra lại đường dẫn import (./ so với ../) và đảm bảo file có đuôi .ts hoặc .js. 📁" },
//   { "content": "🛡️ [Helmet] Lỗi 'Refused to load the script because it violates CSP'. \n🛠️ Cách fix: Thêm domain của script đó vào whitelist 'script-src' trong cấu hình helmet.contentSecurityPolicy. 🛡️" },
//   { "content": "🧪 [Supertest] Lỗi 'ECONNRESET'. \n🛠️ Cách fix: Server bị sập trong quá trình test, hãy kiểm tra log backend để tìm lỗi sập (crash). 🧪" },
//   { "content": "🔧 [NestJS] Lỗi 'Internal Server Error' khi trả về BigInt. \n🛠️ Cách fix: JSON.stringify không hỗ trợ BigInt, hãy convert BigInt sang String trước khi trả về client. 🔢" },
//   { "content": "📊 [NewRelic] Lỗi 'High memory usage by agent'. \n🛠️ Cách fix: Giảm tần suất gửi dữ liệu (harvest cycle) hoặc nâng cấp phiên bản agent mới nhất. 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Error: No such container'. \n🛠️ Cách fix: Container đã bị xóa hoặc chưa được tạo, hãy kiểm tra lại kết quả của lệnh docker ps -a. 🧱" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_INVALID_METHOD'. \n🛠️ Cách fix: Phương thức HTTP truyền vào (GET, POST,...) có ký tự lạ hoặc khoảng trắng. ❌" },
//   { "content": "📡 [Kafka] Lỗi 'Offset out of range'. \n🛠️ Cách fix: Consumer yêu cầu offset đã bị xóa khỏi log, hãy reset offset về 'earliest' hoặc 'latest'. 📡" },
//   { "content": "🗄️ [Mongoose] Lỗi 'Path `X` is invalid'. \n🛠️ Cách fix: Dữ liệu truyền vào không khớp với kiểu enum hoặc validation đã định nghĩa trong schema. 💾" },
//   { "content": "🧪 [Jest] Lỗi 'Snapshots do not match'. \n🛠️ Cách fix: Code UI/Data đã thay đổi, nếu đúng ý đồ hãy chạy 'jest -u' để cập nhật lại file snapshot. 🧪" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Database connection is closed'. \n🛠️ Cách fix: Đừng gọi query sau khi đã thực hiện DataSource.destroy(), kiểm tra vòng đời của ứng dụng. 🏗️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Payload too large (413)'. \n🛠️ Cách fix: Tăng giới hạn body size trong main.ts: app.use(json({ limit: '10mb' })). 📂" },
//   { "content": "🌀 [Redis] Lỗi 'Socket closed unexpectedly'. \n🛠️ Cách fix: Kiểm tra firewall hoặc timeout của server Redis, bật tính năng keep-alive trong client. 🌀" },
//   { "content": "🛡️ [Passport] Lỗi 'Strategy not registered'. \n🛠️ Cách fix: Đảm bảo đã gọi passport.use(new LocalStrategy(...)) trước khi gọi authenticate(). 🔐" },
//   { "content": "📦 [NPM] Lỗi 'npm update' không nhảy version. \n🛠️ Cách fix: Kiểm tra ký hiệu ^ hoặc ~ trong package.json, nếu muốn lên bản mới nhất hãy dùng 'npm install package@latest'. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'Req.session is undefined'. \n🛠️ Cách fix: Đảm bảo middleware express-session đã được khai báo TRƯỚC các router sử dụng nó. ⚙️" },
//   { "content": "🔌 [Mongoose] Lỗi 'Collection.ensureIndex is deprecated'. \n🛠️ Cách fix: Cập nhật Mongoose lên bản mới hoặc set 'useCreateIndex: true' (cho bản cũ) để dùng createIndex. 🔌" },
//   { "content": "🛡️ [CORS] Lỗi 'Access-Control-Allow-Methods' không cho phép PUT/DELETE. \n🛠️ Cách fix: Cấu hình 'methods' trong middleware cors của Express để liệt kê đầy đủ các phương thức. 🛡️" },
//   { "content": "🚀 [Heroku] Lỗi 'Error H14 (No web processes running)'. \n🛠️ Cách fix: Chạy lệnh 'heroku ps:scale web=1' để bật instance cho ứng dụng. 🚀" },
//   { "content": "📂 [Multer] Lỗi 'Limit field value characters'. \n🛠️ Cách fix: Dữ liệu text trong form-data quá dài, hãy tăng 'fieldSize' trong cấu hình limits của Multer. 📂" },
//   { "content": "🧪 [Jest] Lỗi 'TextEncoder is not defined'. \n🛠️ Cách fix: Jest chạy trong môi trường JSDOM thiếu API này, hãy polyfill nó trong jest.setup.js. 🧪" },
//   { "content": "🔧 [TypeScript] Lỗi 'Argument of type 'string' is not assignable to parameter of type 'never''. \n🛠️ Cách fix: Kiểm tra mảng của bạn, có thể bạn đã khai báo mảng rỗng [] mà không chỉ định type. 🔧" },
//   { "content": "🏗️ [NestJS] Lỗi 'Circular dependency in @Inject()'. \n🛠️ Cách fix: Dùng forwardRef() ngay trong constructor của class bị dính vòng lặp. 🔄" },
//   { "content": "🗃️ [Postgres] Lỗi 'Integer out of range'. \n🛠️ Cách fix: Cột ID đang dùng INT (max ~2 tỷ), hãy migrate sang BIGINT nếu dữ liệu quá lớn. 📏" },
//   { "content": "📡 [GraphQL] Lỗi 'Schema must contain unique named types'. \n🛠️ Cách fix: Bạn đang định nghĩa 2 Type cùng tên trong schema, hãy kiểm tra lại file .graphql hoặc code-first. 📡" },
//   { "content": "🛡️ [Argon2] Lỗi 'Argon2_Error: Memory allocation failed'. \n🛠️ Cách fix: Giảm thông số memoryCost hoặc tăng RAM của server. 🧠" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_TRAILER_INVALID'. \n🛠️ Cách fix: Bạn đang gửi Trailer Header không đúng định dạng HTTP/1.1 hoặc HTTP/2. ❌" },
//   { "content": "📦 [Docker] Lỗi 'Container name already in use'. \n🛠️ Cách fix: Dùng 'docker rm -f name' để xóa container cũ trước khi start cái mới cùng tên. 🏗️" },
//   { "content": "🧪 [Mocha] Lỗi 'Double callback'. \n🛠️ Cách fix: Một hàm async trả về cả Promise và gọi cả callback done(), hãy chỉ chọn 1 trong 2. 🧪" },
//   { "content": "🛠️ [NestJS] Lỗi 'Validation failed (numeric string is expected)'. \n🛠️ Cách fix: Tham số truyền vào @Param() không phải là số, hãy kiểm tra lại giá trị từ client. ✅" },
//   { "content": "🌐 [Axios] Lỗi 'ECONNREFUSED 127.0.0.1:80'. \n🛠️ Cách fix: Server backend chưa chạy hoặc bạn quên điền port vào URL API. 📡" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Table doesn't exist'. \n🛠️ Cách fix: Kiểm tra tên bảng (thường Sequelize tự thêm 's' vào cuối tên model), dùng 'freezeTableName: true' để giữ nguyên. 🗃️" },
//   { "content": "🛡️ [XSS] Lỗi 'Script injected via URL parameter'. \n🛠️ Cách fix: Luôn dùng encodeURIComponent() khi render dữ liệu từ URL lên giao diện. 🛡️" },
//   { "content": "⚙️ [Linux] Lỗi 'Read-only file system'. \n🛠️ Cách fix: Disk bị lỗi vật lý hoặc bị remount sang chế độ đọc, hãy check dmesg và reboot/repair disk. 📁" }
// ]

// const tweets = [
//   { "content": "🚨 [High Concurrency] Lỗi 'Race Condition' khi trừ số dư ví điện tử. \n🛠️ Cách fix: Sử dụng 'SELECT FOR UPDATE' trong SQL hoặc 'Redlock' trong Redis để đảm bảo tính nguyên tử (Atomicity). 💸" },
//   { "content": "🔍 [Microservices] Lỗi 'Cascading Failure' khi một service hạ tầng bị chậm. \n🛠️ Cách fix: Triển khai Circuit Breaker bằng thư viện Resilience4j hoặc Opossum để ngắt kết nối ngay lập tức khi lỗi vượt ngưỡng. 🔌" },
//   { "content": "🛠️ [System Design] Lỗi 'Thundering Herd' khi Cache Redis hết hạn đồng thời. \n🛠️ Cách fix: Cài đặt thời gian hết hạn (TTL) ngẫu nhiên (Jitter) để các request không đổ dồn vào DB cùng lúc. 📉" },
//   { "content": "💡 [Performance] Lỗi 'Context Switching' quá cao do tạo quá nhiều Worker Thread. \n🛠️ Cách fix: Sử dụng Thread Pool với số lượng thread tối ưu dựa trên số nhân CPU thực tế của server. 🧠" },
//   { "content": "🚀 [Redis] Lỗi 'Hot Key' làm quá tải một single shard trong Cluster. \n🛠️ Cách fix: Sử dụng kỹ thuật Client-side caching hoặc nhân bản (Replication) các key nóng sang nhiều node khác nhau. 🌀" },
//   { "content": "🛡️ [Security] Lỗi 'IDOR' (Insecure Direct Object Reference) trong API. \n🛠️ Cách fix: Luôn kiểm tra quyền sở hữu của user (userId) đối với bản ghi trước khi thực hiện các thao tác CRUD. 🔑" },
//   { "content": "⚡ [DevOps] Lỗi 'Configuration Drift' giữa môi trường Staging và Production. \n🛠️ Cách fix: Áp dụng Infrastructure as Code (Terraform/Ansible) để đồng bộ cấu hình hạ tầng tự động. 🏗️" },
//   { "content": "📦 [Kubernetes] Lỗi 'OOMKilled' dù giới hạn RAM (Limit) vẫn chưa chạm mức tối đa. \n🛠️ Cách fix: Kiểm tra giới hạn 'request memory', có thể Node vật lý đã hết RAM thực tế để cấp phát thêm. 🎡" },
//   { "content": "🔑 [Authentication] Lỗi 'JWT Token Sidejacking' qua mạng không bảo mật. \n🛠️ Cách fix: Luôn sử dụng flag 'Secure' và 'HttpOnly' cho Cookie chứa token để tránh bị đánh cắp bởi script lạ. 🛡️" },
//   { "content": "💾 [PostgreSQL] Lỗi 'Transaction ID Wraparound' làm treo Database. \n🛠️ Cách fix: Cấu hình 'Autovacuum' hoạt động tích cực hơn để dọn dẹp các ID giao dịch cũ trong bảng dữ liệu lớn. 🧹" },
//   { "content": "🏗️ [Elasticsearch] Lỗi 'Split Brain' trong Cluster cũ (v6.x trở về trước). \n🛠️ Cách fix: Cấu hình 'discovery.zen.minimum_master_nodes' bằng công thức (n/2 + 1). 📊" },
//   { "content": "🧬 [React Native] Lỗi 'Bridge Congestion' làm UI bị giật lag khi truyền data lớn. \n🛠️ Cách fix: Sử dụng JSI (JavaScript Interface) hoặc chuyển sang dùng FlashList thay vì FlatList để tối ưu render. 📱" },
//   { "content": "📉 [System Design] Lỗi 'Dual Writes' gây bất đồng bộ giữa DB và Search Engine. \n🛠️ Cách fix: Sử dụng mô hình Change Data Capture (CDC) với Debezium hoặc Transactional Outbox Pattern. 📬" },
//   { "content": "📞 [Microservices] Lỗi 'Distributed Tracing' bị đứt quãng giữa các service. \n🛠️ Cách fix: Sử dụng OpenTelemetry để truyền traceparent header qua tất cả các cuộc gọi HTTP/gRPC. 📡" },
//   { "content": "🔀 [Nginx] Lỗi 'Upstream sent too big header' khi dùng JWT quá lớn. \n🛠️ Cách fix: Tăng giá trị 'proxy_buffer_size' và 'proxy_buffers' trong file cấu hình Nginx. ⚙️" },
//   { "content": "📜 [NestJS] Lỗi 'Memory Leak' khi sử dụng RxJS Observable mà không unsubscribe. \n🛠️ Cách fix: Sử dụng toán tử 'takeUntil' hoặc 'first' để đảm bảo stream được đóng sau khi hoàn tất. 🌀" },
//   { "content": "🛠️ [CI/CD] Lỗi 'Build Artifact' quá nặng làm chậm pipeline. \n🛠️ Cách fix: Sử dụng 'Multi-stage builds' trong Docker để chỉ giữ lại file thực thi cuối cùng trong image. 🏗️" },
//   { "content": "📡 [RabbitMQ] Lỗi 'Unacknowledged messages' làm đầy RAM của Broker. \n🛠️ Cách fix: Kiểm tra logic xử lý, đảm bảo luôn gọi 'channel.ack()' sau khi consumer xử lý xong message. 🐰" },
//   { "content": "🧊 [Frontend] Lỗi 'Layout Thrashing' do gọi DOM API liên tục trong vòng lặp. \n🛠️ Cách fix: Nhóm các thao tác đọc/ghi DOM lại hoặc sử dụng requestAnimationFrame để tối ưu hóa. 🖼️" },
//   { "content": "🗄️ [ClickHouse] Lỗi 'Too many parts' khi thực hiện Insert liên tục từng dòng. \n🛠️ Cách fix: Gom dữ liệu thành các mảng lớn (Batch Insert) ít nhất 1000 dòng trước khi ghi vào database. 🗄️" },
//   { "content": "🧪 [Testing] Lỗi 'Flaky Tests' do phụ thuộc vào thời gian thực hệ thống. \n🛠️ Cách fix: Sử dụng các thư viện Mock Time (như Sinon.js fake timers) để kiểm soát thời gian trong test case. 🧪" },
//   { "content": "🔌 [GraphQL] Lỗi 'N+1 problem' với các quan hệ phức tạp. \n🛠️ Cách fix: Sử dụng DataLoader của Facebook để batching và caching các request truy vấn dữ liệu trùng lặp. 📊" },
//   { "content": "🛠️ [Docker] Lỗi 'Dangling images' chiếm dụng hàng chục GB đĩa cứng. \n🛠️ Cách fix: Chạy định kỳ lệnh 'docker image prune' để dọn dẹp các layer không còn gắn với container nào. 🧱" },
//   { "content": "🚀 [AWS] Lỗi 'Cold Start' của Lambda làm API Gateway bị timeout. \n🛠️ Cách fix: Bật 'Provisioned Concurrency' hoặc sử dụng framework siêu nhẹ để giảm thời gian khởi tạo container. ☁️" },
//   { "content": "🔥 [System Design] Lỗi 'Write-ahead Log (WAL)' quá lớn làm đầy ổ đĩa DB. \n🛠️ Cách fix: Kiểm tra cơ chế replication hoặc backup, đảm bảo các log file đã được đẩy đi thành công trước khi xóa. 💾" },
//   { "content": "🔧 [Flutter] Lỗi 'RenderFlex overflow' khi hiển thị text quá dài. \n🛠️ Cách fix: Bọc Widget trong 'Expanded', 'Flexible' hoặc sử dụng 'SingleChildScrollView' để hỗ trợ cuộn. 📱" },
//   { "content": "🛑 [Microservices] Lỗi 'Cyclic Dependency' giữa các service khi deploy. \n🛠️ Cách fix: Tách các logic chung ra một Shared Service hoặc sử dụng Event-driven để giảm liên kết trực tiếp. 📡" },
//   { "content": "🌐 [Web Security] Lỗi 'Session Fixation' do không cấp mới Session ID sau khi login. \n🛠️ Cách fix: Luôn gọi hàm 'req.session.regenerate()' ngay sau khi xác thực người dùng thành công. 🔐" },
//   { "content": "🏗️ [Kubernetes] Lỗi 'Sticky Sessions' bị mất khi Scaling Pod. \n🛠️ Cách fix: Sử dụng Redis để quản lý Session tập trung hoặc cấu hình 'Session Affinity' trên Ingress Controller. 🎡" },
//   { "content": "🛡️ [Auth] Lỗi 'Slow Hash' làm treo Server khi có nhiều request Login. \n🛠️ Cách fix: Điều chỉnh lại 'work factor' của Bcrypt/Argon2 phù hợp hoặc chuyển việc hash sang một microservice riêng. 🔑" },
//   { "content": "📊 [Monitoring] Lỗi 'Cardinality Explosion' trong Prometheus metrics. \n🛠️ Cách fix: Tránh đưa các giá trị dynamic (như userId, email) vào label của metrics. 📊" },
//   { "content": "🧱 [Infrastructure] Lỗi 'Single Point of Failure' (SPOF). \n🛠️ Cách fix: Triển khai mô hình High Availability (HA) với ít nhất 2 instance chạy ở 2 Availability Zone khác nhau. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Backpressure' khi pipe dữ liệu từ tốc độ cao sang thấp. \n🛠️ Cách fix: Kiểm tra giá trị trả về của 'stream.write()' và đợi sự kiện 'drain' trước khi ghi tiếp dữ liệu. ⚙️" },
//   { "content": "🌀 [Redis] Lỗi 'Big Keys' (Key chứa hàng triệu phần tử) làm treo node khi xóa. \n🛠️ Cách fix: Sử dụng lệnh 'UNLINK' thay vì 'DEL' để xóa key lớn một cách bất đồng bộ không gây block. 🌀" },
//   { "content": "💉 [Database] Lỗi 'Phantom Reads' trong transaction. \n🛠️ Cách fix: Nâng mức độ Isolation Level lên 'Serializable' hoặc sử dụng Row-level locking hợp lý. 🗃️" },
//   { "content": "📦 [DevOps] Lỗi 'Secret Leak' khi lỡ commit file .env lên Git. \n🛠️ Cách fix: Sử dụng công cụ 'git-filter-repo' để xóa triệt để lịch sử và thu hồi toàn bộ key ngay lập tức. 🛡️" },
//   { "content": "🧩 [NestJS] Lỗi 'Request-scoped provider' làm chậm hiệu năng. \n🛠️ Cách fix: Hạn chế dùng scope REQUEST cho service, chuyển sang dùng Singleton scope nếu có thể. 🧩" },
//   { "content": "🔐 [Crypto] Lỗi 'Weak IV (Initialization Vector)' trong mã hóa AES. \n🛠️ Cách fix: Luôn sử dụng 'crypto.randomBytes(16)' để tạo IV mới cho mỗi lần mã hóa dữ liệu. 🔐" },
//   { "content": "🚦 [API Design] Lỗi 'Lack of Versioning' khi thay đổi cấu trúc response. \n🛠️ Cách fix: Luôn sử dụng tiền tố '/v1/', '/v2/' trong URL hoặc dùng Header 'Accept-Version'. 🚦" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Lazy Loading' gây ra hàng trăm query ẩn. \n🛠️ Cách fix: Chuyển sang 'Eager Loading' hoặc dùng QueryBuilder để JOIN các bảng cần thiết một cách chủ động. 🏗️" },
//   { "content": "☁️ [AWS CloudFront] Lỗi 'Stale Content' dù đã update file gốc trên S3. \n🛠️ Cách fix: Thực hiện lệnh 'Invalidation' cho đường dẫn file đó trên CloudFront sau khi deploy code mới. ☁️" },
//   { "content": "🛠️ [System Design] Lỗi 'Clock Skew' làm sai lệch thứ tự event trong hệ thống phân tán. \n🛠️ Cách fix: Sử dụng thuật toán 'Vector Clocks' hoặc 'Lamport Timestamps' thay vì tin tưởng vào giờ hệ thống. 🕒" },
//   { "content": "📝 [Logging] Lỗi 'Disk Full' do file log quá lớn mà không xoay vòng. \n🛠️ Cách fix: Sử dụng tiện ích 'logrotate' trên Linux hoặc cấu hình log-rotation trong winston/pino. 📝" },
//   { "content": "🧪 [Frontend] Lỗi 'Memory Leak' do gắn sự kiện window.addEventListener mà không gỡ bỏ. \n🛠️ Cách fix: Gọi hàm removeEventListener trong lifecycle 'componentWillUnmount' hoặc 'useEffect' cleanup. 🧪" },
//   { "content": "🔧 [ESLint] Lỗi 'Floating Promises' (quên await). \n🛠️ Cách fix: Bật rule '@typescript-eslint/no-floating-promises' để bắt buộc xử lý mọi Promise. ✅" },
//   { "content": "🗄️ [Cassandra] Lỗi 'Tombstone Overflow' làm chậm query delete. \n🛠️ Cách fix: Hạn chế delete dữ liệu, thay vào đó hãy sử dụng TTL hoặc thiết kế lại cấu trúc bảng. 🗃️" },
//   { "content": "🛡️ [Security] Lỗi 'Clickjacking' trang quản trị. \n🛠️ Cách fix: Cấu hình header 'X-Frame-Options: SAMEORIGIN' để ngăn trang web bị nhúng vào iframe lạ. 🛡️" },
//   { "content": "🌐 [CDN] Lỗi 'CORS' khi load font/image từ CDN khác domain. \n🛠️ Cách fix: Cấu hình Header 'Access-Control-Allow-Origin' chính xác trên server lưu trữ file (Origin). 🌐" },
//   { "content": "🚀 [Performance] Lỗi 'Excessive DOM size' làm trình duyệt lag khi render. \n🛠️ Cách fix: Sử dụng kỹ thuật Virtual Scroll để chỉ render những item đang hiển thị trên màn hình. 🖼️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_INVALID_CHAR' trong Cookie. \n🛠️ Cách fix: Luôn encode giá trị cookie bằng encodeURIComponent() trước khi set vào header. 🍪" },
//   { "content": "📦 [K8s] Lỗi 'ImagePullBackOff' do vượt quá rate limit của Docker Hub. \n🛠️ Cách fix: Sử dụng Mirror Registry hoặc đăng nhập tài khoản trả phí vào 'imagePullSecrets'. 🎡" },
//   { "content": "🧩 [NestJS] Lỗi 'Global Filter' không bắt được lỗi từ Gateway/WebSocket. \n🛠️ Cách fix: Sử dụng 'BaseWsExceptionFilter' riêng cho WebSocket thay vì ExceptionFilter của HTTP. 🔌" },
//   { "content": "💾 [Redis] Lỗi 'Slave in the past' (Replication lag). \n🛠️ Cách fix: Kiểm tra băng thông mạng giữa master-slave và tối ưu hóa các lệnh ghi quá nặng. 💾" },
//   { "content": "🛡️ [Auth] Lỗi 'Token Bloat' khi lưu quá nhiều thông tin vào JWT. \n🛠️ Cách fix: Chỉ lưu ID user và các quyền cơ bản (roles), các thông tin khác nên fetch từ DB hoặc Cache. 🛡️" },
//   { "content": "🔀 [Git] Lỗi 'Detached HEAD' khi checkout nhầm commit. \n🛠️ Cách fix: Tạo một branch mới từ commit đó bằng 'git checkout -b <branch-name>' để lưu lại thay đổi. 🔀" },
//   { "content": "🧱 [Docker] Lỗi 'Shm-size too small' khi chạy các app cần nhiều bộ nhớ chia sẻ. \n🛠️ Cách fix: Tăng dung lượng bằng flag '--shm-size' trong lệnh run hoặc docker-compose. 🏗️" },
//   { "content": "📡 [Microservices] Lỗi 'Saga Pattern' không rollback được khi một bước bị lỗi. \n🛠️ Cách fix: Thiết kế các 'Compensating Transactions' để đảo ngược dữ liệu cho từng bước đã thành công trước đó. 🔄" },
//   { "content": "🧪 [Postman] Lỗi 'Self-signed certificate' chặn gọi API HTTPS. \n🛠️ Cách fix: Tắt option 'SSL certificate verification' trong phần Settings của Postman. 🧪" },
//   { "content": "🔧 [TS] Lỗi 'Non-null assertion operator (!)' gây runtime crash. \n🛠️ Cách fix: Sử dụng 'Optional Chaining (?.)' hoặc kiểm tra if-null check thay vì ép kiểu bất chấp. ✅" },
//   { "content": "🏗️ [System Design] Lỗi 'Database Sharding' không cân bằng dữ liệu giữa các node. \n🛠️ Cách fix: Chọn 'Shard Key' có độ phân tán (high cardinality) tốt, tránh dùng các trường như giới tính/vùng miền. 🏗️" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'Out of disk space' do Temp Files khi sort mảng lớn. \n🛠️ Cách fix: Tăng thông số 'work_mem' để các thao tác sort/join diễn ra trong RAM nhiều hơn. 🗃️" },
//   { "content": "🔌 [Websocket] Lỗi 'Memory leak' khi client disconnect liên tục. \n🛠️ Cách fix: Đảm bảo xóa bỏ mọi listener và dọn dẹp biến gắn với socketId ngay khi sự kiện 'disconnect' xảy ra. 🔌" },
//   { "content": "🛡️ [Security] Lỗi 'Host Header Injection'. \n🛠️ Cách fix: Cấu hình Nginx/Server chỉ chấp nhận các request có Host header nằm trong whitelist cố định. 🛡️" },
//   { "content": "📂 [Linux] Lỗi 'Too many links' khi tạo quá nhiều thư mục con. \n🛠️ Cách fix: Sử dụng các hệ thống lưu trữ như S3 hoặc phân cấp thư mục theo mã băm (hash-based partitioning). 📂" },
//   { "content": "🚀 [Vercel] Lỗi 'Serverless Function Execution Timeout'. \n🛠️ Cách fix: Chuyển các tác vụ tốn thời gian sang kiến trúc 'Background Job' hoặc tối ưu lại tốc độ query DB. 🚀" },
//   { "content": "⚙️ [Express] Lỗi 'App.locals' bị ghi đè lung tung giữa các request. \n🛠️ Cách fix: Chỉ sử dụng 'res.locals' cho dữ liệu riêng biệt của từng request, 'app.locals' chỉ dùng cho hằng số. ⚙️" },
//   { "content": "🧩 [NestJS] Lỗi 'Unbounded concurrency' khi dùng Promise.all(). \n🛠️ Cách fix: Sử dụng thư viện 'p-limit' để giới hạn số lượng promise chạy song song, tránh làm sập DB. 📉" },
//   { "content": "🛡️ [OAuth2] Lỗi 'Open Redirect' qua tham số redirect_uri. \n🛠️ Cách fix: Luôn kiểm tra whitelist domain cho tham số redirect_uri trước khi thực hiện chuyển hướng. 🛡️" },
//   { "content": "🧪 [Jest] Lỗi 'Process out of memory' khi chạy hàng ngàn file test. \n🛠️ Cách fix: Chạy test với flag '--runInBand' để các test case chạy tuần tự thay vì song song quá mức. 🧪" },
//   { "content": "🔧 [Frontend] Lỗi 'Flicker of Unstyled Content (FOUC)'. \n🛠️ Cách fix: Đảm bảo CSS quan trọng được inline hoặc load ở thẻ <head> trước khi render body. 🖼️" },
//   { "content": "📊 [Database] Lỗi 'Index Skip Scan' không được trigger. \n🛠️ Cách fix: Kiểm tra lại thứ tự các cột trong Composite Index, cột có độ lọc cao nên đứng đầu. 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Port mapping conflict' giữa các project. \n🛠️ Cách fix: Sử dụng Docker Network và Nginx Proxy Manager để truy cập qua domain thay vì map thủ công ra port host. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Uncaught Exception' làm sập toàn bộ app. \n🛠️ Cách fix: Luôn dùng 'process.on(uncaughtException)' để log lỗi và thực hiện 'Graceful Shutdown' thay vì để app chết đột ngột. 🛑" },
//   { "content": "📡 [Kafka] Lỗi 'Consumer Lag' tăng cao. \n🛠️ Cách fix: Tăng số lượng Partition và thêm Consumer instance để xử lý dữ liệu song song hiệu quả hơn. 📡" },
//   { "content": "🗄️ [MongoDB] Lỗi 'Background index build' làm chậm database. \n🛠️ Cách fix: Sử dụng flag 'background: true' (cho bản cũ) hoặc tạo index vào khung giờ thấp điểm. 💾" },
//   { "content": "🧪 [Testing] Lỗi 'Database pollution' giữa các test case. \n🛠️ Cách fix: Sử dụng các thư viện như 'testcontainers' để tạo DB riêng biệt cho mỗi lần chạy test suite. 🧪" },
//   { "content": "🏗️ [Microservices] Lỗi 'API Gateway' quá tải (Single Point of Failure). \n🛠️ Cách fix: Triển khai nhiều instance Gateway và đặt đằng sau một Layer 4 Load Balancer (như F5 hoặc NLB). 🏗️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Request body truncated' khi nhận webhook lớn. \n🛠️ Cách fix: Cấu hình 'raw body' trong NestJS để nhận dữ liệu nguyên bản từ các dịch vụ như Stripe. 🛡️" },
//   { "content": "🌀 [Redis] Lỗi 'Key Eviction' nhầm các data quan trọng. \n🛠️ Cách fix: Tách biệt Redis dùng cho Cache (maxmemory-policy LRU) và Redis dùng cho Session/Storage (Noeviction). 🌀" },
//   { "content": "🛡️ [Auth] Lỗi 'Timing Attack' khi so sánh hash mật khẩu. \n🛠️ Cách fix: Sử dụng hàm 'crypto.timingSafeEqual()' để thời gian so sánh luôn hằng định bất kể chuỗi đúng hay sai. 🔐" },
//   { "content": "📦 [Yarn] Lỗi 'Plug'n'Play (PnP) incompatibility'. \n🛠️ Cách fix: Chuyển về chế độ 'node-modules' truyền thống bằng cách set 'nodeLinker: node-modules' trong .yarnrc.yml. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'Trust Proxy' không được bật làm sai lệch IP người dùng. \n🛠️ Cách fix: Set 'app.set(trust proxy, 1)' khi ứng dụng đứng sau Nginx hoặc Cloudflare. 🌐" },
//   { "content": "🔌 [Mongoose] Lỗi 'Connection Timeout' khi DB đang bận. \n🛠️ Cách fix: Tăng thông số 'serverSelectionTimeoutMS' trong tùy chọn kết nối của Mongoose. 🔌" },
//   { "content": "🛡️ [CORS] Lỗi 'Access-Control-Allow-Headers' thiếu các custom header. \n🛠️ Cách fix: Liệt kê rõ các header tùy chỉnh (như x-api-key) trong cấu hình allowedHeaders của middleware cors. 🛡️" },
//   { "content": "🚀 [Heroku] Lỗi 'Ephemeral filesystem'. \n🛠️ Cách fix: Đừng lưu file vào thư mục local, hãy chuyển sang dùng S3 hoặc Cloudinary để lưu trữ dữ liệu bền vững. ☁️" },
//   { "content": "📂 [Multer] Lỗi 'DiskStorage' làm đầy ổ cứng server. \n🛠️ Cách fix: Sử dụng 'MemoryStorage' để xử lý file nhanh trong RAM rồi đẩy thẳng lên cloud, không lưu tại server. 📂" },
//   { "content": "🧪 [Jest] Lỗi 'Environment mismatch' giữa Node và JSDOM. \n🛠️ Cách fix: Đảm bảo sử dụng '@jest-environment jsdom' cho các test case liên quan đến UI/DOM. 🧪" },
//   { "content": "🔧 [TypeScript] Lỗi 'Private class members' bị lộ khi log ra console. \n🛠️ Cách fix: Sử dụng cú pháp private thật của JS (#field) thay vì keyword 'private' của TS để bảo mật tốt hơn. 🔐" },
//   { "content": "🏗️ [NestJS] Lỗi 'Circular dependency in constructor' (không dùng forwardRef). \n🛠️ Cách fix: Đảm bảo kiểm tra kỹ các quan hệ chéo và dùng forwardRef() ở cả hai đầu của sự phụ thuộc. 🔄" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'Shared buffer' quá thấp. \n🛠️ Cách fix: Tăng thông số 'shared_buffers' (thường khoảng 25% tổng RAM) để tối ưu hiệu năng đọc ghi. 🗃️" },
//   { "content": "📡 [GraphQL] Lỗi 'Exposing Internal Errors'. \n🛠️ Cách fix: Sử dụng hàm 'formatError' để ẩn các stack trace chi tiết khỏi client trong môi trường Production. 🛡️" },
//   { "content": "🛡️ [Argon2] Lỗi 'Parallelism factor too high'. \n🛠️ Cách fix: Điều chỉnh tham số 'parallelism' phù hợp với số lượng CPU cores khả dụng trên server. 🧠" },
//   { "content": "⚙️ [Node.js] Lỗi 'Maximum call stack size exceeded' khi xử lý đệ quy. \n🛠️ Cách fix: Chuyển sang sử dụng vòng lặp (iteration) hoặc kỹ thuật 'Trampoline' để tránh tràn stack. ⚙️" },
//   { "content": "📦 [Docker] Lỗi 'Permission denied' cho file log trong volume. \n🛠️ Cách fix: Đảm bảo UID/GID của user trong container khớp với quyền sở hữu file trên máy host. 🐧" },
//   { "content": "🧪 [Mocha] Lỗi 'Uncaught error in hook'. \n🛠️ Cách fix: Kiểm tra kỹ các logic trong 'beforeAll' hoặc 'afterEach', lỗi ở đây sẽ làm dừng toàn bộ suite. 🧪" },
//   { "content": "🛠️ [NestJS] Lỗi 'ValidationPipe' bỏ qua các field lạ (Overposting). \n🛠️ Cách fix: Bật option 'whitelist: true' và 'forbidNonWhitelisted: true' để chặn dữ liệu dư thừa. ✅" },
//   { "content": "🌐 [Axios] Lỗi 'Request failed with status 304'. \n🛠️ Cách fix: Đây là cơ chế cache của HTTP, hãy kiểm tra lại logic handle response nếu bạn coi đây là một lỗi. 📡" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Eager loading without association'. \n🛠️ Cách fix: Đảm bảo đã khai báo quan hệ (hasMany, belongsTo) ở cả hai Model trước khi dùng 'include'. 🗃️" },
//   { "content": "🛡️ [XSS] Lỗi 'dangerouslySetInnerHTML' trong React. \n🛠️ Cách fix: Luôn sử dụng thư viện DOMPurify để làm sạch chuỗi HTML trước khi gán vào thuộc tính này. 🛡️" },
//   { "content": "⚙️ [Linux] Lỗi 'Zombie process' (Status Z). \n🛠️ Cách fix: Đảm bảo process cha thực hiện lệnh 'wait()' để thu hồi tài nguyên từ các process con đã kết thúc. 🧟" }
// ]

// const tweets = [
//   { "content": "🚨 [High Concurrency] Lỗi 'Invisible Deadlock' khi update bảng theo thứ tự ID ngẫu nhiên. \n🛠️ Cách fix: Luôn sắp xếp danh sách ID đầu vào (sort IDs) trước khi thực hiện batch update để đảm bảo thứ tự lock nhất quán. 🔐" },
//   { "content": "🔍 [Microservices] Lỗi 'Idempotency Key' bị trùng lặp trong hàng đợi retry. \n🛠️ Cách fix: Sử dụng Redis để lưu trạng thái xử lý của mỗi RequestId trong thời gian ngắn (TTL) để tránh xử lý một giao dịch hai lần. 🔄" },
//   { "content": "🛠️ [System Design] Lỗi 'Write Amplification' quá cao trên ổ SSD do ghi dữ liệu nhỏ liên tục. \n🛠️ Cách fix: Sử dụng cơ chế Buffer/Batching để gom các bản ghi nhỏ thành một khối lớn trước khi commit xuống đĩa. 💾" },
//   { "content": "💡 [Performance] Lỗi 'Long GC Pause' do tạo quá nhiều object ngắn hạn trong loop. \n🛠️ Cách fix: Tối ưu hóa việc tái sử dụng object (Object Pooling) và kiểm tra lại cấu hình bộ nhớ Heap. 🧠" },
//   { "content": "🚀 [Redis] Lỗi 'Lua Script Timeout' làm block toàn bộ các request khác. \n🛠️ Cách fix: Chia nhỏ logic trong script Lua hoặc tối ưu câu lệnh để thời gian thực thi luôn dưới vài milisecond. 🌀" },
//   { "content": "🛡️ [Security] Lỗi 'NoSQL Injection' qua toán tử $where hoặc $gt trong MongoDB. \n🛠️ Cách fix: Luôn sử dụng thư viện sanitize-html hoặc ép kiểu dữ liệu input đầu vào trước khi đưa vào query object. 🛡️" },
//   { "content": "⚡ [DevOps] Lỗi 'Docker Layer Cache Invalidation' do đặt lệnh COPY file nguồn trước lệnh RUN npm install. \n🛠️ Cách fix: Luôn COPY package.json và chạy npm install trước khi COPY phần code còn lại để tận dụng cache layer. 🏗️" },
//   { "content": "📦 [Kubernetes] Lỗi 'Node Pressure' do không giới hạn (Limit) tài nguyên cho Pod. \n🛠️ Cách fix: Luôn định nghĩa cả 'requests' và 'limits' cho CPU/RAM để K8s scheduler có thể quản lý tài nguyên hiệu quả. 🎡" },
//   { "content": "🔑 [Authentication] Lỗi 'JWT None Algorithm' cho phép bypass xác thực. \n🛠️ Cách fix: Cấu hình thư viện JWT để chỉ chấp nhận các thuật toán an toàn (như HS256, RS256) và từ chối 'none'. 🔐" },
//   { "content": "💾 [PostgreSQL] Lỗi 'Index Bloat' sau khi thực hiện quá nhiều lệnh UPDATE/DELETE. \n🛠️ Cách fix: Chạy 'REINDEX' định kỳ hoặc cấu hình autovacuum tối ưu hơn để giải phóng không gian dư thừa trong file index. 🗃️" },
//   { "content": "🏗️ [Elasticsearch] Lỗi 'Circuit Breaking Exception' do dữ liệu aggregation quá lớn. \n🛠️ Cách fix: Tăng RAM cho node hoặc sử dụng 'Breadth-first' search thay vì 'Depth-first' trong các truy vấn lồng nhau. 📊" },
//   { "content": "🧬 [React Native] Lỗi 'Z-Index' không hoạt động đồng nhất giữa Android và iOS. \n🛠️ Cách fix: Trên Android, hãy sử dụng thuộc tính 'elevation' kết hợp với zIndex để đảm bảo phần tử hiển thị đúng lớp. 📱" },
//   { "content": "📉 [System Design] Lỗi 'Fan-out' quá lớn khi gửi notification cho triệu người dùng cùng lúc. \n🛠️ Cách fix: Sử dụng Message Queue (Kafka/RabbitMQ) để phân phối tải và xử lý background theo từng lô (batch). 📡" },
//   { "content": "📞 [Microservices] Lỗi 'Clock Drift' làm sai lệch thời hạn của Token giữa các server. \n🛠️ Cách fix: Sử dụng giao thức NTP để đồng bộ thời gian thực cho tất cả các node trong cụm server. 🕒" },
//   { "content": "🔀 [Nginx] Lỗi '504 Gateway Timeout' khi upstream server xử lý quá chậm. \n🛠️ Cách fix: Tăng 'proxy_read_timeout' hoặc tối ưu hóa tốc độ xử lý của ứng dụng Backend. ⚙️" },
//   { "content": "📜 [NestJS] Lỗi 'Invalid Dependency' do sử dụng interface thay vì class cho Injection Token. \n🛠️ Cách fix: TypeScript interface biến mất khi compile sang JS, hãy sử dụng class hoặc @Inject('TOKEN_STRING'). 🧩" },
//   { "content": "🛠️ [CI/CD] Lỗi 'Pipeline Congestion' do chạy quá nhiều tích hợp đồng thời trên một Runner. \n🛠️ Cách fix: Cấu hình giới hạn concurrency trong file pipeline và sử dụng nhiều Runner/Agent khác nhau. 🏗️" },
//   { "content": "📡 [RabbitMQ] Lỗi 'Priority Queue' không hoạt động đúng do consumer quá nhanh. \n🛠️ Cách fix: Giảm giá trị 'prefetch count' xuống 1 để broker có cơ hội sắp xếp lại thứ tự ưu tiên các tin nhắn mới. 🐰" },
//   { "content": "🧊 [Frontend] Lỗi 'Passive Event Listener' làm chậm thao tác scroll trên mobile. \n🛠️ Cách fix: Sử dụng option { passive: true } khi addEventListener cho các sự kiện wheel, mousewheel, touch. 🖼️" },
//   { "content": "🗄️ [ClickHouse] Lỗi 'Too many parts' do sử dụng quá nhiều phân vùng (Partitioning) nhỏ. \n🛠️ Cách fix: Chỉ nên partition theo tháng hoặc năm, tránh partition theo ngày nếu dữ liệu mỗi ngày quá ít. 🗄️" },
//   { "content": "🧪 [Testing] Lỗi 'Hardcoded Port' làm thất bại khi chạy nhiều test suite song song. \n🛠️ Cách fix: Sử dụng port 0 để hệ điều hành tự động cấp phát port ngẫu nhiên còn trống cho mỗi tiến trình test. 🧪" },
//   { "content": "🔌 [GraphQL] Lỗi 'Exceeding Max Depth' do query lồng nhau vô tận. \n🛠️ Cách fix: Sử dụng middleware graphql-depth-limit để giới hạn độ sâu tối đa của các câu truy vấn. 📊" },
//   { "content": "🛠️ [Docker] Lỗi 'Zombie process inside container' do không có init process. \n🛠️ Cách fix: Sử dụng flag '--init' khi chạy docker run hoặc dùng tini làm entrypoint trong Dockerfile. 🧱" },
//   { "content": "🚀 [AWS] Lỗi 'S3 Bucket Policy' quá lỏng lẻo làm lộ dữ liệu nhạy cảm. \n🛠️ Cách fix: Luôn bật 'Block Public Access' và sử dụng 'CloudFront OAI' để chỉ cho phép truy cập qua CDN. ☁️" },
//   { "content": "🔥 [System Design] Lỗi 'Cache Inconsistency' sau khi DB rollback. \n🛠️ Cách fix: Sử dụng 'Two-phase commit' hoặc 'Transactional Outbox' để đảm bảo cache chỉ bị xóa khi DB đã commit thành công. 💾" },
//   { "content": "🔧 [Flutter] Lỗi 'setState() called after dispose()'. \n🛠️ Cách fix: Luôn kiểm tra 'if (mounted)' trước khi gọi setState trong các hàm callback bất đồng bộ. 📱" },
//   { "content": "🛑 [Microservices] Lỗi 'Distributed Lock Leak' do app crash khi đang giữ lock. \n🛠️ Cách fix: Luôn set 'TTL' (Time To Live) cho lock trong Redis để nó tự động giải phóng nếu không được renew. 🔒" },
//   { "content": "🌐 [Web Security] Lỗi 'MIME Sniffing' cho phép thực thi script từ file ảnh. \n🛠️ Cách fix: Cấu hình header 'X-Content-Type-Options: nosniff' trên web server. 🛡️" },
//   { "content": "🏗️ [Kubernetes] Lỗi 'Pod Eviction' do Node bị hết bộ nhớ đệm (Disk Pressure). \n🛠️ Cách fix: Cấu hình dọn dẹp log Docker tự động và kiểm tra các thư mục /tmp trong container. 🎡" },
//   { "content": "🛡️ [Auth] Lỗi 'JWT Secret Leak' do lưu trực tiếp trong code (Hardcoded). \n🛠️ Cách fix: Sử dụng AWS Secrets Manager hoặc HashiCorp Vault để nạp secret vào biến môi trường khi runtime. 🔑" },
//   { "content": "📊 [Monitoring] Lỗi 'Missing Alerts' do cấu hình ngưỡng quá cao. \n🛠️ Cách fix: Áp dụng 'Anomaly Detection' thay vì chỉ dùng ngưỡng cố định (Static Threshold) cho các chỉ số quan trọng. 📊" },
//   { "content": "🧱 [Infrastructure] Lỗi 'SGP (Security Group) Overlap' gây khó quản lý. \n🛠️ Cách fix: Sử dụng mảng 'Source Security Group' thay vì mở dải IP (CIDR) để phân quyền giữa các tier. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Uncaught Promise Rejection' làm sập process ở các bản Node cũ. \n🛠️ Cách fix: Luôn bọc code trong block try-catch hoặc sử dụng process.on('unhandledRejection'). ⚙️" },
//   { "content": "🌀 [Redis] Lỗi 'Slow Logs' do lệnh KEYS * hoặc SMEMBERS trên tập dữ liệu lớn. \n🛠️ Cách fix: Chuyển sang sử dụng SCAN, SSCAN, HSCAN để duyệt dữ liệu theo từng batch nhỏ không block. 🌀" },
//   { "content": "💉 [Database] Lỗi 'Deadlock' khi hai transaction chờ lock chéo nhau. \n🛠️ Cách fix: Thiết lập 'lock_timeout' để transaction tự hủy thay vì chờ vô hạn, giúp hệ thống phục hồi nhanh. 🗃️" },
//   { "content": "📦 [DevOps] Lỗi 'Broken Pipe' khi upload file lớn qua Nginx. \n🛠️ Cách fix: Tăng 'client_body_timeout' và 'client_max_body_size' phù hợp với khối lượng file dự kiến. 🛡️" },
//   { "content": "🧩 [NestJS] Lỗi 'Circular Dependency in Service' (Module A -> B, B -> A). \n🛠️ Cách fix: Sử dụng 'forwardRef' ở cả decorator @Inject() trong constructor và trong file Module. 🧩" },
//   { "content": "🔐 [Crypto] Lỗi 'Reusing Initialization Vector (IV)' trong mã hóa. \n🛠️ Cách fix: IV phải luôn là duy nhất (unique) và ngẫu nhiên cho mỗi lần thực hiện mã hóa AES. 🔐" },
//   { "content": "🚦 [API Design] Lỗi 'Missing Pagination' cho các endpoint danh sách. \n🛠️ Cách fix: Luôn yêu cầu tham số 'limit' và 'offset' (hoặc cursor) để tránh làm sập server khi dữ liệu tăng. 🚦" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Transaction leak' do không gọi commit hoặc rollback. \n🛠️ Cách fix: Luôn bọc logic transaction trong khối try-finally để đảm bảo 'queryRunner.release()' được gọi. 🏗️" },
//   { "content": "☁️ [AWS] Lỗi 'IAM Policy Wildcard' quá rộng (*). \n🛠️ Cách fix: Áp dụng nguyên tắc 'Least Privilege', chỉ cấp quyền cụ thể trên từng Resource ARN nhất định. ☁️" },
//   { "content": "🛠️ [System Design] Lỗi 'Write-Back Cache' làm mất dữ liệu khi crash. \n🛠️ Cách fix: Sử dụng 'Write-Through Cache' nếu độ tin cậy dữ liệu là ưu tiên hàng đầu hơn là độ trễ ghi. 🕒" },
//   { "content": "📝 [Logging] Lỗi 'Sensitive Data Leak' trong log hệ thống. \n🛠️ Cách fix: Sử dụng hàm filter/masking để ẩn đi email, mật khẩu, số thẻ tín dụng trước khi ghi log. 📝" },
//   { "content": "🧪 [Frontend] Lỗi 'Memory Leak' do khởi tạo thư viện bên thứ 3 trong useEffect mà không dọn dẹp. \n🛠️ Cách fix: Luôn return một hàm cleanup để destroy các instance (như Map, Chart, Socket) trong React. 🧪" },
//   { "content": "🔧 [ESLint] Lỗi 'Missing return type' làm code khó bảo trì. \n🛠️ Cách fix: Bật rule '@typescript-eslint/explicit-module-boundary-types' để bắt buộc định nghĩa kiểu trả về. ✅" },
//   { "content": "🗄️ [Cassandra] Lỗi 'Secondary Index' làm chậm hiệu năng query. \n🛠️ Cách fix: Hạn chế dùng index phụ, thay vào đó hãy thiết kế lại 'Clustering Key' để tối ưu hóa truy vấn. 🗃️" },
//   { "content": "🛡️ [Security] Lỗi 'Reflected XSS' qua tham số tìm kiếm trên URL. \n🛠️ Cách fix: Luôn thực hiện HTML Entity Encoding cho bất kỳ dữ liệu nào nhận từ URL trước khi render. 🛡️" },
//   { "content": "🌐 [CDN] Lỗi 'Vary Header Missing' làm cache sai phiên bản cho thiết bị. \n🛠️ Cách fix: Cấu hình 'Vary: User-Agent' hoặc 'Accept-Encoding' để CDN phân phối đúng file tối ưu. 🌐" },
//   { "content": "🚀 [Performance] Lỗi 'Unnecessary Re-renders' trong React do truyền object/function inline. \n🛠️ Cách fix: Sử dụng 'useMemo' và 'useCallback' để giữ nguyên tham chiếu giữa các lần render. 🖼️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_INVALID_STATUS_CODE' (giá trị > 599). \n🛠️ Cách fix: Kiểm tra logic xử lý lỗi, đảm bảo status code trả về nằm trong dải chuẩn (100-599). ❌" },
//   { "content": "📦 [K8s] Lỗi 'ContainerPort mismatch' với Service port. \n🛠️ Cách fix: Đảm bảo 'targetPort' trong Service object khớp chính xác với 'containerPort' trong Deployment. 🎡" },
//   { "content": "🧩 [NestJS] Lỗi 'Interceptors' không chạy khi throw exception thủ công. \n🛠️ Cách fix: Sử dụng 'Exception Filters' để xử lý logic biến đổi response khi có lỗi xảy ra. 🔌" },
//   { "content": "💾 [Redis] Lỗi 'AOF Rewrite failure' làm đầy ổ đĩa. \n🛠️ Cách fix: Kiểm tra quyền ghi của user chạy Redis và cấu hình 'no-appendfsync-on-rewrite' hợp lý. 💾" },
//   { "content": "🛡️ [Auth] Lỗi 'Short JWT Secret' dễ bị tấn công brute-force. \n🛠️ Cách fix: Secret key cho JWT nên có độ dài tối thiểu 256-bit (32 ký tự) và được tạo ngẫu nhiên. 🛡️" },
//   { "content": "🔀 [Git] Lỗi 'Merge Commit' làm rối lịch sử (History). \n🛠️ Cách fix: Sử dụng 'git rebase' để giữ cho luồng commit thẳng và sạch sẽ hơn trước khi merge vào main branch. 🔀" },
//   { "content": "🧱 [Docker] Lỗi 'Build-time secrets' bị lộ trong layer image. \n🛠️ Cách fix: Sử dụng tính năng '--secret' của Docker BuildKit thay vì dùng ARG hoặc ENV cho mật khẩu. 🧱" },
//   { "content": "📡 [Microservices] Lỗi 'Message Duplication' trong Event-driven. \n🛠️ Cách fix: Triển khai 'Idempotent Consumer', kiểm tra xem message ID đã được xử lý trong DB chưa. 🔄" },
//   { "content": "🧪 [Postman] Lỗi 'Environment variable' không được update. \n🛠️ Cách fix: Sử dụng hàm 'pm.environment.set()' trong phần Tests script để tự động lưu giá trị từ response. 🧪" },
//   { "content": "🔧 [TS] Lỗi 'Excessive use of type casting' (as Any). \n🛠️ Cách fix: Sử dụng 'Type Guards' hoặc 'Zod' để parse và validate kiểu dữ liệu thực tế tại runtime. ✅" },
//   { "content": "🏗️ [System Design] Lỗi 'Database Connection Exhaustion'. \n🛠️ Cách fix: Sử dụng cơ chế 'Connection Pooling' và thiết lập giới hạn 'max connections' phù hợp trên server. 🏗️" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'Vacuum not reclaiming space'. \n🛠️ Cách fix: Kiểm tra các 'Long running transactions' đang chặn vacuum dọn dẹp các hàng cũ (dead tuples). 🗃️" },
//   { "content": "🔌 [Websocket] Lỗi 'Zombie Connections' trên Load Balancer. \n🛠️ Cách fix: Bật tính năng 'TCP Keepalive' và cấu hình heartbeat định kỳ từ phía ứng dụng. 🔌" },
//   { "content": "🛡️ [Security] Lỗi 'Information Exposure' qua tiêu đề 'Server' (ví dụ: Server: Express). \n🛠️ Cách fix: Sử dụng helmet để ẩn hoặc ghi đè header 'X-Powered-By' và thông tin server. 🛡️" },
//   { "content": "📂 [Linux] Lỗi 'Disk Quota Exceeded' cho một user cụ thể. \n🛠️ Cách fix: Kiểm tra và tăng quota bằng lệnh 'edquota' hoặc dọn dẹp các file rác của user đó. 📂" },
//   { "content": "🚀 [Vercel] Lỗi 'Static Generation Timeout'. \n🛠️ Cách fix: Chia nhỏ các trang cần build hoặc tối ưu hóa tốc độ của các API gọi trong getStaticProps. 🚀" },
//   { "content": "⚙️ [Express] Lỗi 'Req.body undefined' khi dùng body-parser sai thứ tự. \n🛠️ Cách fix: Khai báo 'app.use(express.json())' trước tất cả các định nghĩa route. ⚙️" },
//   { "content": "🧩 [NestJS] Lỗi 'Static module' không nạp được biến môi trường. \n🛠️ Cách fix: Sử dụng 'ConfigModule.forRoot({ isGlobal: true })' để đảm bảo env có sẵn ở mọi nơi. 📉" },
//   { "content": "🛡️ [OAuth2] Lỗi 'State parameter missing' gây tấn công CSRF login. \n🛠️ Cách fix: Luôn gửi và kiểm tra tham số 'state' ngẫu nhiên trong luồng xác thực OAuth2. 🛡️" },
//   { "content": "🧪 [Jest] Lỗi 'Timeouts' khi test các hàm xử lý file lớn. \n🛠️ Cách fix: Tăng thời gian chờ mặc định bằng 'jest.setTimeout(10000)' cho các test case đặc thù. 🧪" },
//   { "content": "🔧 [Frontend] Lỗi 'Hydration Mismatch' trong Next.js. \n🛠️ Cách fix: Đảm bảo dữ liệu render trên server và client hoàn toàn giống nhau, tránh dùng các biến như 'window' lúc render. 🖼️" },
//   { "content": "📊 [Database] Lỗi 'Table Scan' do thiếu index trên cột WHERE. \n🛠️ Cách fix: Sử dụng lệnh 'EXPLAIN ANALYZE' để phát hiện các truy vấn không sử dụng index. 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Large image size' do không dùng .dockerignore. \n🛠️ Cách fix: Loại bỏ node_modules, .git và các file log khỏi quá trình build để giảm dung lượng image. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Memory Leak' trong Buffer.allocUnsafe(). \n🛠️ Cách fix: Luôn sử dụng Buffer.alloc() nếu không thực sự cần hiệu năng cực cao và không thể quản lý vùng nhớ. 🛑" },
//   { "content": "📡 [Kafka] Lỗi 'Rebalance Protocol' gây dừng xử lý quá lâu. \n🛠️ Cách fix: Tối ưu hóa 'max.poll.interval.ms' và đảm bảo logic xử lý của consumer không bị block quá lâu. 📡" },
//   { "content": "🗄️ [MongoDB] Lỗi 'Sort operation exceeded memory limit'. \n🛠️ Cách fix: Tạo index cho các trường dùng để sort hoặc sử dụng 'allowDiskUse: true' trong aggregation. 💾" },
//   { "content": "🧪 [Testing] Lỗi 'Async leaks' làm Jest không thể kết thúc. \n🛠️ Cách fix: Kiểm tra các handle chưa đóng (database connection, timers) bằng flag '--detectOpenHandles'. 🧪" },
//   { "content": "🏗️ [Microservices] Lỗi 'Service Registry' không cập nhật IP pod mới. \n🛠️ Cách fix: Giảm 'TTL' của bản ghi DNS hoặc cấu hình 'health check' nhạy bén hơn trong Consul/Eureka. 🏗️" },
//   { "content": "🛠️ [NestJS] Lỗi 'Multiple instances of same provider'. \n🛠️ Cách fix: Đảm bảo provider được export từ một module chung thay vì khai báo lại ở nhiều module khác nhau. 🛡️" },
//   { "content": "🌀 [Redis] Lỗi 'Key churn' làm cache hit rate thấp. \n🛠️ Cách fix: Phân tích lại chiến lược đặt TTL và đảm bảo các key quan trọng không bị đẩy ra quá sớm. 🌀" },
//   { "content": "🛡️ [Auth] Lỗi 'Brute force' vào endpoint Login. \n🛠️ Cách fix: Triển khai 'Rate Limiting' theo IP hoặc theo Account bằng thư viện express-rate-limit. 🔐" },
//   { "content": "📦 [NPM] Lỗi 'Lockfile conflict' sau khi merge code. \n🛠️ Cách fix: Chạy 'npm install' lại để npm tự động giải quyết các xung đột trong file package-lock.json. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'Missing error handler' làm lộ stack trace. \n🛠️ Cách fix: Luôn định nghĩa một middleware lỗi cuối cùng (có 4 tham số) để format lại lỗi trả về. ⚙️" },
//   { "content": "🔌 [Mongoose] Lỗi 'Validation failed on update'. \n🛠️ Cách fix: Bật option 'runValidators: true' trong hàm findOneAndUpdate để đảm bảo dữ liệu mới vẫn đúng schema. 🔌" },
//   { "content": "🛡️ [CORS] Lỗi 'Multiple Access-Control-Allow-Origin' headers. \n🛠️ Cách fix: Kiểm tra xem cả Nginx và App có cùng set header này không, chỉ nên để một nơi quản lý. 🛡️" },
//   { "content": "🚀 [Heroku] Lỗi 'H13 (Connection closed without response)'. \n🛠️ Cách fix: Kiểm tra các lỗi sập nguồn (crash) đột ngột của tiến trình Node.js ngay khi vừa nhận request. 🚀" },
//   { "content": "📂 [Multer] Lỗi 'File extension filtering' bị bypass. \n🛠️ Cách fix: Đừng chỉ check đuôi file, hãy kiểm tra 'Magic Bytes' (file signature) để xác định đúng loại file. 📂" },
//   { "content": "🧪 [Jest] Lỗi 'Global variable leak' giữa các file test. \n🛠️ Cách fix: Sử dụng 'jest.resetModules()' hoặc đảm bảo không gán giá trị vào 'global' object trong code test. 🧪" },
//   { "content": "🔧 [TypeScript] Lỗi 'Enums' gây khó khăn khi debug/logging. \n🛠️ Cách fix: Sử dụng 'Union Types' (type Status = 'active' | 'inactive') thay vì Enum để code JS gọn nhẹ hơn. 🔧" },
//   { "content": "🏗️ [NestJS] Lỗi 'Custom Decorator' không nhận được metadata. \n🛠️ Cách fix: Sử dụng 'Reflector' class để truy xuất metadata đã gắn vào các method hoặc controller. 🔄" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'SSL connection error' khi kết nối Cloud DB. \n🛠️ Cách fix: Đảm bảo đã tải và cấu hình đúng chứng chỉ CA (ca.crt) trong tham số kết nối của pg driver. 🗃️" },
//   { "content": "📡 [GraphQL] Lỗi 'Circular fragments'. \n🛠️ Cách fix: Kiểm tra và phá vỡ các fragment gọi đệ quy lẫn nhau trong câu truy vấn GraphQL. 📡" },
//   { "content": "🛡️ [Argon2] Lỗi 'Salt buffer too small'. \n🛠️ Cách fix: Để thư viện tự động tạo salt với độ dài mặc định thay vì tự truyền thủ công nếu không cần thiết. 🧠" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_STREAM_ALREADY_FINISHED'. \n🛠️ Cách fix: Kiểm tra xem có đang cố ghi (write) vào một stream đã được đóng (end) trước đó không. ❌" },
//   { "content": "📦 [Docker] Lỗi 'Container port not accessible from host'. \n🛠️ Cách fix: Đảm bảo đã dùng flag '-p 8080:8080' và ứng dụng đang lắng nghe trên '0.0.0.0' chứ không phải '127.0.0.1'. 🏗️" },
//   { "content": "🧪 [Mocha] Lỗi 'Arrow function in test' làm mất 'this.timeout'. \n🛠️ Cách fix: Sử dụng 'function () {}' truyền thống cho các test case cần truy cập vào context của Mocha. 🧪" },
//   { "content": "🛠️ [NestJS] Lỗi 'Missing @Module decorator'. \n🛠️ Cách fix: Mọi module đều phải được đánh dấu bằng decorator @Module() để NestJS có thể nhận diện. ✅" },
//   { "content": "🌐 [Axios] Lỗi 'Circular object in JSON' khi log error. \n🛠️ Cách fix: Chỉ log 'error.message' hoặc 'error.response.data' thay vì log toàn bộ đối tượng error của Axios. 📡" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Decimal precision loss'. \n🛠️ Cách fix: Sử dụng kiểu dữ liệu 'DECIMAL' hoặc 'STRING' (để parse thủ công) thay vì 'FLOAT/DOUBLE' cho tiền tệ. 🗃️" },
//   { "content": "🛡️ [XSS] Lỗi 'Template literal' không được escape. \n🛠️ Cách fix: Sử dụng các thư viện như 'common-tags' hoặc tự viết hàm tag function để sanitize dữ liệu chèn vào template. 🛡️" },
//   { "content": "⚙️ [Linux] Lỗi 'I/O Wait' cao làm treo server. \n🛠️ Cách fix: Kiểm tra tốc độ đọc ghi của ổ đĩa bằng lệnh 'iostat' và tối ưu hóa các tiến trình ghi log/db quá nặng. 📁" }
// ]

// const tweets = [
//   { "content": "🚨 [High Concurrency] Lỗi 'Write Skew' trong mức cô lập Repeatable Read. \n🛠️ Cách fix: Sử dụng mức cô lập SERIALIZABLE hoặc cơ chế Optimistic Concurrency Control (OCC) với cột version. 📉" },
//   { "content": "🔍 [Microservices] Lỗi 'Semantic Monitoring' - Service vẫn 'Up' nhưng logic nghiệp vụ bị sai. \n🛠️ Cách fix: Triển khai 'Synthetic Transaction' để kiểm tra định kỳ các luồng nghiệp vụ quan trọng từ đầu đến cuối. 🧪" },
//   { "content": "🛠️ [System Design] Lỗi 'Positive Feedback Loop' khi hệ thống retry quá nhanh làm sập server vừa mới hồi phục. \n🛠️ Cách fix: Áp dụng 'Exponential Backoff' kết hợp với 'Jitter' (độ trễ ngẫu nhiên) để giãn cách các đợt retry. ⚡" },
//   { "content": "💡 [Performance] Lỗi 'False Sharing' trong bộ nhớ đệm CPU khi nhiều thread ghi vào các biến nằm gần nhau. \n🛠️ Cách fix: Sử dụng 'Padding' (thêm khoảng trống) giữa các biến quan trọng để chúng nằm trên các Cache Line khác nhau. 🧠" },
//   { "content": "🚀 [Redis] Lỗi 'Big Key Eviction Pause' - Xóa một Hash hoặc List triệu phần tử làm nghẽn Single-thread của Redis. \n🛠️ Cách fix: Sử dụng lệnh 'UNLINK' thay cho 'DEL' để xóa bất đồng bộ, hoặc chia nhỏ key thành nhiều phần. 🌀" },
//   { "content": "🛡️ [Security] Lỗi 'SSRF' (Server-Side Request Forgery) qua các hàm fetch URL từ user. \n🛠️ Cách fix: Sử dụng Whitelist IP/Domain và chặn các địa chỉ nội bộ như 127.0.0.1 hoặc metadata của Cloud provider. 🛡️" },
//   { "content": "⚡ [DevOps] Lỗi 'Dangling Volume' chiếm dụng tài nguyên lưu trữ của máy host. \n🛠️ Cách fix: Chạy 'docker volume prune' định kỳ để dọn dẹp các volume không còn liên kết với container nào. 🧱" },
//   { "content": "📦 [Kubernetes] Lỗi 'Pod Disruption Budget' bị cấu hình quá chặt làm Cluster không thể nâng cấp node. \n🛠️ Cách fix: Đảm bảo số lượng 'minAvailable' hợp lý để K8s có thể di dời pod khi cần bảo trì hạ tầng. 🎡" },
//   { "content": "🔑 [Authentication] Lỗi 'JWT ID (jti) Replay Attack'. \n🛠️ Cách fix: Sử dụng claim 'jti' duy nhất cho mỗi token và lưu chúng vào Redis (Blacklist) để chặn việc tái sử dụng token cũ. 🔐" },
//   { "content": "💾 [PostgreSQL] Lỗi 'Transaction ID Exhaustion' dẫn đến DB rơi vào trạng thái Read-only. \n🛠️ Cách fix: Giám sát 'age(datfrozenxid)' và ép buộc chạy VACUUM FREEZE trên các bảng có số lượng transaction lớn. 🗃️" },
//   { "content": "🏗️ [System Design] Lỗi 'Dead-letter Queue (DLQ) Overflow' làm tràn bộ nhớ của Broker. \n🛠️ Cách fix: Giám sát số lượng message trong DLQ và cấu hình alert để xử lý thủ công các message lỗi liên tục. 📩" },
//   { "content": "🧬 [React Native] Lỗi 'JS Thread Block' do thực hiện tính toán nặng (như parse JSON cực lớn). \n🛠️ Cách fix: Sử dụng 'InteractionManager.runAfterInteractions' hoặc đẩy việc tính toán xuống Native Module thông qua JSI. 📱" },
//   { "content": "📉 [Distributed Systems] Lỗi 'Clock Drift' làm hỏng thứ tự các sự kiện trong log tập trung. \n🛠️ Cách fix: Không dựa vào timestamp cục bộ; sử dụng Hybrid Logical Clocks (HLC) để duy trì thứ tự nhân quả. 🕒" },
//   { "content": "📞 [Microservices] Lỗi 'API Versioning' qua Media Type không được hỗ trợ bởi client cũ. \n🛠️ Cách fix: Hỗ trợ 'Content Negotiation' và luôn cung cấp cơ chế fallback cho các phiên bản cũ hơn (Backward Compatibility). 🚦" },
//   { "content": "🔀 [Nginx] Lỗi 'Upstream Timed Out' khi khởi động container Node.js quá chậm. \n🛠️ Cách fix: Thêm 'health check' vào cấu hình Upstream hoặc tăng 'proxy_connect_timeout'. ⚙️" },
//   { "content": "📜 [NestJS] Lỗi 'Memory Leak' trong ứng dụng lâu dài do lưu trữ context trong AsyncLocalStorage mà không dọn dẹp. \n🛠️ Cách fix: Đảm bảo vòng đời của context kết thúc ngay khi request hoàn tất (thường NestJS tự xử lý, hãy cẩn thận khi dùng thủ công). 🧩" },
//   { "content": "🛠️ [CI/CD] Lỗi 'Insecure Docker Socket' khi mount /var/run/docker.sock vào container CI. \n🛠️ Cách fix: Sử dụng 'Docker-in-Docker' (DinD) hoặc công cụ build không cần daemon như Kaniko để đảm bảo an toàn. 🛡️" },
//   { "content": "📡 [Kafka] Lỗi 'Consumer Group Rebalance' liên tục do logic xử lý quá lâu. \n🛠️ Cách fix: Tăng 'max.poll.interval.ms' hoặc đẩy logic xử lý ra một mảng worker riêng biệt bên ngoài consumer. 📡" },
//   { "content": "🧊 [Frontend] Lỗi 'Cumulative Layout Shift (CLS)' do load font hoặc ảnh không có kích thước định sẵn. \n🛠️ Cách fix: Luôn set width/height cho ảnh và sử dụng font-display: swap để tránh làm nhảy giao diện. 🖼️" },
//   { "content": "🗄️ [ClickHouse] Lỗi 'Dictionary Update Failure' làm sai lệch dữ liệu phân tích. \n🛠️ Cách fix: Giám sát bảng system.dictionaries và cấu hình cơ chế retry khi nguồn dữ liệu bên ngoài bị lỗi. 📊" },
//   { "content": "🧪 [Testing] Lỗi 'Mock Pollution' khi một test case ghi đè lên module chung mà không reset. \n🛠️ Cách fix: Luôn gọi 'jest.restoreAllMocks()' hoặc 'clearAllMocks()' trong block afterEach. 🧪" },
//   { "content": "🔌 [gRPC] Lỗi 'ALTS connection failed' khi chạy bên ngoài Google Cloud. \n🛠️ Cách fix: ALTS chỉ dành cho nội bộ GCP, hãy chuyển sang dùng TLS/SSL thông thường khi giao tiếp bên ngoài. 🔐" },
//   { "content": "🛠️ [Docker] Lỗi 'OverlayFS: Upper dir is maximum depth' khi build quá nhiều tầng image. \n🛠️ Cách fix: Hợp nhất các lệnh RUN trong Dockerfile bằng toán tử && để giảm số lượng layer. 🧱" },
//   { "content": "🚀 [AWS] Lỗi 'Lambda Throttle' khi đạt ngưỡng concurrency giới hạn của tài khoản. \n🛠️ Cách fix: Yêu cầu tăng 'Service Quota' hoặc tối ưu hóa Lambda để giảm thời gian thực thi (Execution time). ☁️" },
//   { "content": "🔥 [Database] Lỗi 'Page Corruption' do server bị mất điện đột ngột khi đang ghi dữ liệu. \n🛠️ Cách fix: Đảm bảo bật 'Full Page Writes' trong Postgres hoặc cơ chế tương đương để phục hồi từ WAL sau crash. 💾" },
//   { "content": "🔧 [Flutter] Lỗi 'Binary Messenger' bị lỗi khi gọi Native Code từ background thread. \n🛠️ Cách fix: Luôn đảm bảo thực hiện các cuộc gọi Platform Channel trên Main Thread (UI Thread). 📱" },
//   { "content": "🛑 [Microservices] Lỗi 'Partial Failure' - Một request gọi 5 service, 1 service lỗi làm hỏng toàn bộ flow. \n🛠️ Cách fix: Thiết kế 'Graceful Degradation' - trả về dữ liệu mặc định hoặc dữ liệu cũ nếu một service phụ bị lỗi. 🏗️" },
//   { "content": "🌐 [Web Security] Lỗi 'Clickjacking' trên các form nhạy cảm. \n🛠️ Cách fix: Sử dụng Content-Security-Policy với directive 'frame-ancestors' thay vì chỉ dùng X-Frame-Options. 🛡️" },
//   { "content": "🏗️ [Kubernetes] Lỗi 'Service Type: LoadBalancer' gây tốn kém chi phí không kiểm soát trên Cloud. \n🛠️ Cách fix: Sử dụng Ingress Controller để chia sẻ một Load Balancer duy nhất cho nhiều Service khác nhau. 🎡" },
//   { "content": "🛡️ [Auth] Lỗi 'Broken Session Expired' - Session ID vẫn tồn tại trong DB sau khi logout. \n🛠️ Cách fix: Luôn xóa bản ghi session trong storage (Redis/DB) ngay khi nhận được request logout. 🔑" },
//   { "content": "📊 [Monitoring] Lỗi 'Alert Fatigue' do nhận quá nhiều cảnh báo không quan trọng. \n🛠️ Cách fix: Phân loại Alert theo mức độ (Critical vs Warning) và chỉ gửi notification cho các lỗi thực sự gây gián đoạn. 📊" },
//   { "content": "🧱 [Infrastructure] Lỗi 'Subnet Exhaustion' - Không còn địa chỉ IP để cấp cho các Pod mới. \n🛠️ Cách fix: Thiết kế VPC với dải CIDR đủ rộng ngay từ đầu hoặc sử dụng Secondary CIDR blocks. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Heap Out of Memory' khi xử lý file CSV hàng triệu dòng. \n🛠️ Cách fix: Sử dụng thư viện 'csv-parser' với cơ chế Stream thay vì đọc toàn bộ nội dung file vào biến. ⚙️" },
//   { "content": "🌀 [Redis] Lỗi 'Replication Buffer Overflow' khi Master gửi dữ liệu cho Slave quá nhanh. \n🛠️ Cách fix: Tăng 'client-output-buffer-limit slave' trong file cấu hình redis.conf. 💾" },
//   { "content": "💉 [Database] Lỗi 'Dirty Read' trong mức cô lập Read Uncommitted. \n🛠️ Cách fix: Luôn sử dụng mức cô lập mặc định là Read Committed để tránh đọc dữ liệu chưa được commit. 🗃️" },
//   { "content": "📦 [DevOps] Lỗi 'Immutable Tag Override' - Deploy nhầm version do dùng chung tag 'latest'. \n🛠️ Cách fix: Luôn sử dụng Tag dựa trên Git Commit Hash hoặc Semantic Versioning cho Docker Image. 🏷️" },
//   { "content": "🧩 [NestJS] Lỗi 'Performance hit' do dùng quá nhiều Global Interceptors/Pipes. \n🛠️ Cách fix: Chỉ áp dụng Interceptor ở cấp Controller hoặc Method nếu nó không thực sự cần thiết cho toàn bộ app. 🧩" },
//   { "content": "🔐 [Crypto] Lỗi 'Key Rotation Failure' làm dữ liệu cũ không thể giải mã. \n🛠️ Cách fix: Triển khai cơ chế 'Versioned Keys' - lưu ID của key cùng với dữ liệu đã mã hóa để biết cần dùng key nào. 🔐" },
//   { "content": "🚦 [API Design] Lỗi 'Leaking Internal Implementation' trong response lỗi. \n🛠️ Cách fix: Ẩn các chi tiết như tên bảng, cấu trúc DB hoặc stack trace khỏi thông báo lỗi trả về cho client. 🛡️" },
//   { "content": "🏗️ [TypeORM] Lỗi 'Too many connections' do tạo DataSource instance mới cho mỗi request. \n🛠️ Cách fix: DataSource phải là một Singleton instance duy nhất được dùng chung trong toàn bộ ứng dụng. 🏗️" },
//   { "content": "☁️ [AWS] Lỗi 'Cold Storage Access Delay' khi truy cập file từ S3 Glacier đột ngột. \n🛠️ Cách fix: Cấu hình cơ chế 'Expedited Retrieval' hoặc chuyển dữ liệu hay dùng sang S3 Standard. ☁️" },
//   { "content": "🛠️ [System Design] Lỗi 'Data Silos' làm khó khăn trong việc phân tích dữ liệu chéo. \n🛠️ Cách fix: Xây dựng Data Lake hoặc Data Warehouse tập trung để tổng hợp dữ liệu từ nhiều microservices. 📊" },
//   { "content": "📝 [Logging] Lỗi 'Log Injection' - Hacker chèn ký tự xuống dòng vào input để giả mạo log. \n🛠️ Cách fix: Sanitize các tham số input đầu vào trước khi đưa vào hàm log. 📝" },
//   { "content": "🧪 [Frontend] Lỗi 'Zombie Timers' trong React - setTimeout vẫn chạy sau khi component unmounted. \n🛠️ Cách fix: Luôn lưu ID của timer và gọi clearTimeout trong hàm cleanup của useEffect. 🧪" },
//   { "content": "🔧 [ESLint] Lỗi 'No Restricted Syntax' - Sử dụng các hàm nguy hiểm như eval(). \n🛠️ Cách fix: Cấm sử dụng 'eval' và 'new Function' thông qua rule eslint 'no-eval'. ✅" },
//   { "content": "🗄️ [Mongoose] Lỗi 'Parallel Save' - Gọi .save() trên cùng một doc từ nhiều tiến trình cùng lúc. \n🛠️ Cách fix: Sử dụng 'atomic operators' như $inc, $set thay vì lấy doc ra, sửa rồi save lại. 💾" },
//   { "content": "🛡️ [Security] Lỗi 'Password Hashing Algorithm' lỗi thời (như MD5, SHA1). \n🛠️ Cách fix: Chuyển ngay sang Bcrypt, Argon2 hoặc Scrypt với độ khó (salt/rounds) phù hợp. 🔐" },
//   { "content": "🌐 [CDN] Lỗi 'Missing Cache-Control Header' làm CDN không cache được nội dung tĩnh. \n🛠️ Cách fix: Cấu hình server origin trả về header 'Cache-Control: public, max-age=31536000'. 🌐" },
//   { "content": "🚀 [Performance] Lỗi 'Heavy Main Thread' trong ứng dụng Mobile làm mất 60 FPS. \n🛠️ Cách fix: Chuyển các tác vụ nặng (xử lý ảnh, mã hóa) sang Background Thread hoặc Web Worker (trong web). 🖼️" },
//   { "content": "⚙️ [Node.js] Lỗi 'Buffer Copy Overload' do concat quá nhiều buffer nhỏ trong loop. \n🛠️ Cách fix: Sử dụng mảng các buffer và chỉ gọi Buffer.concat() một lần duy nhất ở cuối. ⚙️" },
//   { "content": "📦 [K8s] Lỗi 'Sidecar Container' không khởi động kịp trước container chính. \n🛠️ Cách fix: Sử dụng 'Native Sidecar' (K8s 1.29+) hoặc logic retry trong app để đợi sidecar sẵn sàng. 🎡" },
//   { "content": "🧩 [NestJS] Lỗi 'Missing Metadata Reflection' khi dùng các thư viện decorator bên thứ ba. \n🛠️ Cách fix: Đảm bảo 'emitDecoratorMetadata' được set là true trong file tsconfig.json. 🛠️" },
//   { "content": "💾 [Redis] Lỗi 'Maxmemory Policy: volatile-lru' xóa mất session quan trọng không có TTL. \n🛠️ Cách fix: Sử dụng 'allkeys-lru' nếu muốn dọn dẹp mọi key, hoặc đảm bảo các data quan trọng luôn có TTL. 💾" },
//   { "content": "🛡️ [Auth] Lỗi 'Improper JWT Validation' - Chỉ check chữ ký mà không check field 'exp' (hết hạn). \n🛠️ Cách fix: Luôn verify đầy đủ các 'standard claims' bao gồm exp, nbf và iat. 🛡️" },
//   { "content": "🔀 [Git] Lỗi 'Large File Commit' làm repo phình to hàng GB. \n🛠️ Cách fix: Sử dụng Git LFS (Large File Storage) cho các file ảnh, video hoặc file thực thi lớn. 🔀" },
//   { "content": "🧱 [Docker] Lỗi 'BuildKit Cache Miss' do sử dụng biến ARG thay đổi liên tục ở đầu Dockerfile. \n🛠️ Cách fix: Đưa các lệnh khai báo ARG hoặc các file hay thay đổi xuống cuối Dockerfile. 🧱" },
//   { "content": "📡 [Kafka] Lỗi 'Unclean Leader Election' làm mất dữ liệu khi leader crash. \n🛠️ Cách fix: Set 'unclean.leader.election.enable=false' để ưu tiên tính toàn vẹn dữ liệu hơn tính sẵn sàng. 📡" },
//   { "content": "🧪 [Postman] Lỗi 'Syncing Conflict' giữa các thành viên trong team. \n🛠️ Cách fix: Sử dụng tính năng 'Fork & Merge' hoặc 'Git Sync' của Postman để quản lý version của collection. 🧪" },
//   { "content": "🔧 [TS] Lỗi 'Excessive Generic nesting' làm compiler chạy cực chậm. \n🛠️ Cách fix: Chia nhỏ các type phức tạp hoặc sử dụng 'Interface' thay vì 'Type alias' để tận dụng cơ chế cache của TS. 🔧" },
//   { "content": "🏗️ [System Design] Lỗi 'Hot Partition' trong NoSQL do dùng ID tăng dần làm partition key. \n🛠️ Cách fix: Sử dụng 'UUID' hoặc kết hợp 'Salt' vào key để phân tán dữ liệu đều trên các shard. 🏗️" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'Bloated TOAST tables'. \n🛠️ Cách fix: Kiểm tra và vacuum các bảng chứa dữ liệu lớn (như TEXT, JSONB) để giải phóng vùng nhớ TOAST ẩn. 🗃️" },
//   { "content": "🔌 [Websocket] Lỗi 'Heartbeat Timeout' làm ngắt kết nối client đang chờ lâu. \n🛠️ Cách fix: Cấu hình 'pingTimeout' và 'pingInterval' phù hợp với chất lượng mạng của người dùng mục tiêu. 🔌" },
//   { "content": "🛡️ [Security] Lỗi 'Insecure Direct Object Reference (IDOR)' trên API file download. \n🛠️ Cách fix: Sử dụng 'Signed URLs' hoặc kiểm tra quyền truy cập file trong DB trước khi gửi stream. 🛡️" },
//   { "content": "📂 [Linux] Lỗi 'No Space Left on Device' do log của Docker quá lớn (/var/lib/docker/containers). \n🛠️ Cách fix: Cấu hình 'log-driver' với 'max-size' và 'max-file' trong file daemon.json của Docker. 📂" },
//   { "content": "🚀 [Next.js] Lỗi 'Serverless Function Size Limit' do import quá nhiều thư viện nặng. \n🛠️ Cách fix: Sử dụng 'dynamic import' (next/dynamic) và kiểm tra kích thước bundle bằng công cụ @next/bundle-analyzer. 🚀" },
//   { "content": "⚙️ [Express] Lỗi 'Double Middleware Execution' do dùng router.use() sai cách. \n🛠️ Cách fix: Kiểm tra xem middleware có bị khai báo cả ở cấp Global và cấp Router hay không. ⚙️" },
//   { "content": "🧩 [NestJS] Lỗi 'Circular Dependency in @Inject()' không dùng forwardRef. \n🛠️ Cách fix: Sử dụng 'forwardRef(() => MyService)' trong decorator @Inject() để giải quyết vòng lặp khởi tạo. 🔄" },
//   { "content": "🛡️ [OAuth2] Lỗi 'Token Leak' qua log của Reverse Proxy. \n🛠️ Cách fix: Cấu hình log để filter/masking header 'Authorization' trước khi ghi xuống file. 🛡️" },
//   { "content": "🧪 [Jest] Lỗi 'Module is not a constructor' khi mock các class của ES6. \n🛠️ Cách fix: Sử dụng 'jest.mock' kết hợp với hàm trả về một class giả lập (mock implementation). 🧪" },
//   { "content": "🔧 [Frontend] Lỗi 'State Batching' làm update state bị sai giá trị cũ trong React. \n🛠️ Cách fix: Luôn sử dụng 'functional update' (setState(prev => prev + 1)) khi state mới phụ thuộc vào state cũ. 🖼️" },
//   { "content": "📊 [Database] Lỗi 'Inefficient Regex Match' trong câu query. \n🛠️ Cách fix: Thay thế Regex bằng các hàm Full-text Search (GIN index trong Postgres) để tăng tốc độ tìm kiếm. 📊" },
//   { "content": "🧱 [Docker] Lỗi 'Exec format error' khi chạy image build trên Mac M1 lên server Linux x86. \n🛠️ Cách fix: Sử dụng 'docker buildx' để build image multi-platform hỗ trợ cả arm64 và amd64. 🏗️" },
//   { "content": "⚙️ [Node.js] Lỗi 'ReferenceError: __dirname is not defined' trong ES Modules. \n🛠️ Cách fix: Sử dụng 'import.meta.url' kết hợp với 'path.dirname' và 'fileURLToPath' để lấy đường dẫn thư mục. 📁" },
//   { "content": "📡 [Kafka] Lỗi 'Message Loss' do 'acks=0' hoặc 'acks=1'. \n🛠️ Cách fix: Set 'acks=all' để đảm bảo tin nhắn đã được ghi xuống ít nhất 'min.insync.replicas' số lượng node. 📡" },
//   { "content": "🗄️ [MongoDB] Lỗi 'Too many open files' khi có quá nhiều kết nối đồng thời. \n🛠️ Cách fix: Sử dụng 'connection pooling' và tăng giới hạn 'ulimit' trên OS chạy MongoDB. 💾" },
//   { "content": "🧪 [Testing] Lỗi 'Clock skewed' khi so sánh thời gian trong các hệ thống phân tán. \n🛠️ Cách fix: Sử dụng thư viện 'time-machine' để đóng băng hoặc giả lập thời gian nhất quán trong suốt quá trình test. 🧪" },
//   { "content": "🏗️ [Microservices] Lỗi 'Shared Database' làm mất tính độc lập giữa các service. \n🛠️ Cách fix: Áp dụng pattern 'Database per Service', mỗi service chỉ được truy cập vào DB của riêng nó. 🏗️" },
//   { "content": "🛠️ [NestJS] Lỗi 'ValidationPipe' không parse được mảng objects. \n🛠️ Cách fix: Sử dụng decorator @Type(() => MyDto) từ thư viện class-transformer bên trong DTO cha. ✅" },
//   { "content": "🌀 [Redis] Lỗi 'Fragmentation Ratio' quá cao làm lãng phí RAM. \n🛠️ Cách fix: Chạy lệnh 'MEMORY PURGE' hoặc cấu hình 'activedefrag' là yes để Redis tự dọn dẹp vùng nhớ. 🌀" },
//   { "content": "🛡️ [Auth] Lỗi 'Reset Password Token' không có thời hạn (Expiration). \n🛠️ Cách fix: Luôn set thời gian sống cực ngắn (ví dụ 15-30 phút) cho các loại token nhạy cảm này. 🔐" },
//   { "content": "📦 [NPM] Lỗi 'Supply Chain Attack' qua các package mồ côi (orphaned). \n🛠️ Cách fix: Sử dụng 'npm audit' và công cụ như 'Snyk' để quét lỗ hổng bảo mật trong cây phụ thuộc. 📦" },
//   { "content": "⚙️ [Express] Lỗi 'Synchronous Error in Async Route' không được catch. \n🛠️ Cách fix: Bọc toàn bộ code async trong try-catch và gọi next(err) hoặc dùng thư viện express-async-errors. ⚙️" },
//   { "content": "🔌 [Mongoose] Lỗi 'Missing _id' khi chèn sub-document. \n🛠️ Cách fix: Mongoose tự tạo _id cho sub-doc, nếu không muốn hãy set '{ _id: false }' trong Schema của sub-doc đó. 🔌" },
//   { "content": "🛡️ [CORS] Lỗi 'Access-Control-Allow-Credentials' là true nhưng Origin là '*'. \n🛠️ Cách fix: Khi cho phép credentials, 'origin' phải là một domain cụ thể, không được dùng ký tự đại diện. 🛡️" },
//   { "content": "🚀 [Heroku] Lỗi 'R14 (Memory quota exceeded)'. \n🛠️ Cách fix: Tối ưu hóa việc sử dụng RAM trong app hoặc nâng cấp lên gói Dyno có cấu hình cao hơn. 🚀" },
//   { "content": "📂 [Multer] Lỗi 'Temporary file leak' khi process bị crash giữa chừng. \n🛠️ Cách fix: Viết script dọn dẹp thư mục temp định kỳ hoặc sử dụng 'memoryStorage' cho các file nhỏ. 📂" },
//   { "content": "🧪 [Jest] Lỗi 'Native Module cannot be mocked'. \n🛠️ Cách fix: Sử dụng 'jest.mock' kèm theo factory function để trả về giá trị giả lập cho các module native của Node. 🧪" },
//   { "content": "🔧 [TypeScript] Lỗi 'Type 'string' is not assignable to type 'enum''. \n🛠️ Cách fix: Sử dụng 'as MyEnum' (Type Assertion) hoặc kiểm tra giá trị đầu vào có thuộc enum không trước khi gán. 🔧" },
//   { "content": "🏗️ [NestJS] Lỗi 'Service not found' trong Unit Test. \n🛠️ Cách fix: Phải khai báo service đó trong mảng 'providers' của Test.createTestingModule. 🔄" },
//   { "content": "🗃️ [PostgreSQL] Lỗi 'Connection limit reached' cho một user cụ thể. \n🛠️ Cách fix: Tăng 'max_connections' hoặc sử dụng PgBouncer để quản lý pool kết nối tập trung. 🗃️" },
//   { "content": "📡 [GraphQL] Lỗi 'Missing resolver' cho một field cụ thể. \n🛠️ Cách fix: Đảm bảo mọi field trong Schema đều có hàm giải quyết tương ứng trong Resolver class. 📡" },
//   { "content": "🛡️ [Argon2] Lỗi 'Incompatible build' trên môi trường Production (như AWS Lambda). \n🛠️ Cách fix: Build/Install package trên cùng hệ điều hành với môi trường chạy thực tế (dùng Docker để build). 🧠" },
//   { "content": "⚙️ [Node.js] Lỗi 'ERR_HTTP_HEADERS_SENT' khi gọi next() sau res.send(). \n🛠️ Cách fix: Luôn dùng 'return res.send()' để đảm bảo hàm kết thúc ngay sau khi gửi response. ❌" },
//   { "content": "📦 [Docker] Lỗi 'Device or resource busy' khi xóa image. \n🛠️ Cách fix: Dừng và xóa tất cả container đang sử dụng các layer của image đó trước khi xóa image. 🏗️" },
//   { "content": "🧪 [Mocha] Lỗi 'Timeout' khi debug bằng breakpoint. \n🛠️ Cách fix: Tăng timeout lên cực lớn hoặc dùng flag '--no-timeouts' khi chạy ở chế độ debug. 🧪" },
//   { "content": "🛠️ [NestJS] Lỗi 'Provider provided more than once' trong cùng một Module. \n🛠️ Cách fix: Kiểm tra mảng providers, xóa các khai báo trùng lặp của cùng một class. ✅" },
//   { "content": "🌐 [Axios] Lỗi 'Proxy Authentication Required' (407). \n🛠️ Cách fix: Cấu hình tham số 'proxy' trong axios request config bao gồm cả username và password. 📡" },
//   { "content": "🗄️ [Sequelize] Lỗi 'Incorrect datetime value' khi lưu vào MySQL. \n🛠️ Cách fix: Đảm bảo múi giờ (timezone) trong cấu hình Sequelize khớp với cấu hình của MySQL server. 🗃️" },
//   { "content": "🛡️ [XSS] Lỗi 'Attribute Injection' - Người dùng chèn code vào thuộc tính như 'onload' của ảnh. \n🛠️ Cách fix: Sử dụng thư viện sanitize-html để lọc bỏ các thuộc tính nguy hiểm bắt đầu bằng 'on'. 🛡️" },
//   { "content": "⚙️ [Linux] Lỗi 'Too many open files' (ulimit). \n🛠️ Cách fix: Tăng giới hạn 'nofile' trong /etc/security/limits.conf cho user chạy ứng dụng. 📁" }
// ]

const tweets = [
  {
    content:
      "🚨 [High Concurrency] Lỗi 'Write Skew' trong Postgres Snapshot Isolation. \n🛠️ Cách fix: Sử dụng mức cô lập SERIALIZABLE hoặc cơ chế SELECT FOR UPDATE để khóa các hàng dữ liệu phụ thuộc trước khi ghi. 📉"
  },
  {
    content:
      "🔍 [Microservices] Lỗi 'Saga Pivot Point' - Bước không thể rollback trong chuỗi giao dịch phân tán. \n🛠️ Cách fix: Đặt các bước có rủi ro cao lên trước, đảm bảo bước 'Pivot' là bước cuối cùng có thể thất bại để dễ dàng bù đắp (Compensate). 🔄"
  },
  {
    content:
      "🛠️ [System Design] Lỗi 'Hot Partition' trong NoSQL do dùng Timestamp làm Shard Key. \n🛠️ Cách fix: Kết hợp Shard Key với một giá trị băm (Hash) hoặc UUID để dữ liệu được phân tán đều trên các node vật lý. 🏗️"
  },
  {
    content:
      "💡 [Performance] Lỗi 'Memory Fragmentation' trong Node.js do cấp phát quá nhiều Buffer nhỏ liên tục. \n🛠️ Cách fix: Sử dụng Buffer Pool (Buffer.allocUnsafe kết hợp quản lý thủ công) hoặc nâng cấp lên phiên bản Node.js có engine V8 mới hơn. 🧠"
  },
  {
    content:
      "🚀 [Redis] Lỗi 'OOM' do Fork process để lưu file RDB khi RAM đã đầy 50%. \n🛠️ Cách fix: Cấu hình 'overcommit_memory = 1' trong Linux kernel để cho phép fork thành công mà không cần copy toàn bộ RAM. 🌀"
  },
  {
    content:
      "🛡️ [Security] Lỗi 'Timing Attack' khi so sánh chữ ký HMAC hoặc Password Hash. \n🛠️ Cách fix: Sử dụng crypto.timingSafeEqual() thay vì toán tử '===' để thời gian phản hồi luôn hằng định. 🔐"
  },
  {
    content:
      "⚡ [DevOps] Lỗi 'Zombie Pods' trong K8s do livenessProbe quá nhạy làm pod restart liên tục. \n🛠️ Cách fix: Tăng 'initialDelaySeconds' và 'failureThreshold' để ứng dụng có đủ thời gian khởi tạo (Warm-up). 🎡"
  },
  {
    content:
      "📦 [Kubernetes] Lỗi 'Kernel Panic' trên Node do Pod vượt quá giới hạn Inode của hệ thống. \n🛠️ Cách fix: Giới hạn số lượng file tạm và giám sát chỉ số 'node_filesystem_files_free' trong Prometheus. 🐧"
  },
  {
    content:
      "🔑 [Authentication] Lỗi 'JWT Refresh Token Rotation Race Condition'. \n🛠️ Cách fix: Cho phép một khoảng thời gian ngắn (Grace Period) mà Refresh Token cũ vẫn có hiệu lực sau khi đã đổi token mới. 🛡️"
  },
  {
    content:
      "💾 [PostgreSQL] Lỗi 'Dead Tuples' không được dọn dẹp do một Transaction chạy quá lâu (Long-running). \n🛠️ Cách fix: Giết các transaction chạy quá giới hạn thời gian (statement_timeout) để Autovacuum có thể làm việc. 🧹"
  },
  {
    content:
      "🏗️ [System Design] Lỗi 'Cache Stampede' khi một Key cực nóng hết hạn. \n🛠️ Cách fix: Sử dụng 'Locking with local cache' hoặc cơ chế 'Early Recomputation' (tự động cập nhật cache trước khi hết hạn). 📉"
  },
  {
    content:
      "🧬 [React Native] Lỗi 'Shadow Tree' bị treo do render quá nhiều component lồng nhau phức tạp. \n🛠️ Cách fix: Sử dụng 'React.memo' và 'FlatList' với 'windowSize' nhỏ để giảm áp lực lên Main Thread. 📱"
  },
  {
    content:
      "📉 [Distributed Systems] Lỗi 'Network Partition' làm mất tính nhất quán trong cụm Kafka. \n🛠️ Cách fix: Cấu hình 'min.insync.replicas' đủ lớn để đảm bảo dữ liệu không bị mất khi một số node bị tách rời mạng. 📡"
  },
  {
    content:
      "📞 [Microservices] Lỗi 'Service Mesh Sidecar Latency' làm tăng độ trễ API. \n🛠️ Cách fix: Tối ưu hóa cấu hình Envoy hoặc chuyển sang dùng 'Proxyless gRPC' để giao tiếp trực tiếp không qua sidecar. 🚀"
  },
  {
    content:
      "🔀 [Nginx] Lỗi 'Upstream hash' không đều khi scale up server. \n🛠️ Cách fix: Sử dụng phương pháp 'Consistent Hashing' để chỉ một lượng nhỏ request bị điều hướng lại khi thay đổi số lượng node. ⚙️"
  },
  {
    content:
      "📜 [NestJS] Lỗi 'Memory Leak' do lưu trữ metadata quá lớn trong Reflect API. \n🛠️ Cách fix: Hạn chế dùng các decorator động tạo ra quá nhiều metadata tại runtime, ưu tiên cấu hình tĩnh. 🧩"
  },
  {
    content:
      "🛠️ [CI/CD] Lỗi 'Insecure Artifact Storage' - Lộ Secret trong Docker Image layer. \n🛠️ Cách fix: Sử dụng '--mount=type=secret' trong Docker BuildKit để truyền secret mà không để lại dấu vết trong image. 🛡️"
  },
  {
    content:
      "📡 [RabbitMQ] Lỗi 'Consumer Prefetch' quá cao làm phân phối tải không đều. \n🛠️ Cách fix: Đặt 'prefetch count' dựa trên công suất xử lý thực tế của mỗi worker (thường bắt đầu từ 1-10). 🐰"
  },
  {
    content:
      "🧊 [Frontend] Lỗi 'Tearing UI' do cập nhật State quá nhanh không khớp với tần số quét màn hình. \n🛠️ Cách fix: Sử dụng 'useDeferredValue' hoặc 'useTransition' (React 18) để ưu tiên các cập nhật quan trọng. 🖼️"
  },
  {
    content:
      "🗄️ [ClickHouse] Lỗi 'MergeTree Data Part Bloat' do Insert quá nhiều lần với lượng dữ liệu nhỏ. \n🛠️ Cách fix: Sử dụng 'Buffer Engine' hoặc gom dữ liệu ở tầng ứng dụng trước khi ghi xuống ClickHouse. 🗄️"
  },
  {
    content:
      "🧪 [Testing] Lỗi 'Integration Test Flakiness' do phụ thuộc vào Database bên thứ ba. \n🛠️ Cách fix: Sử dụng 'TestContainers' để khởi tạo một instance database sạch và hoàn toàn biệt lập cho mỗi lần test. 🧪"
  },
  {
    content:
      "🔌 [gRPC] Lỗi 'Max Message Size Exceeded' khi truyền file lớn. \n🛠️ Cách fix: Sử dụng gRPC Streaming thay vì Unary calls để chia nhỏ file thành các chunk dữ liệu. 📡"
  },
  {
    content:
      "🛠️ [Docker] Lỗi 'Overlay2 Storage Driver' bị chậm trên hệ thống file XFS. \n🛠️ Cách fix: Đảm bảo format XFS với option 'ftype=1' để tương thích tốt nhất với Docker. 🧱"
  },
  {
    content:
      "🚀 [AWS] Lỗi 'EC2 CPU Credits' bị hết làm server chậm đột ngột (Instance t2/t3). \n🛠️ Cách fix: Chuyển sang 'Unlimited Mode' hoặc sử dụng dòng instance 'M' (General Purpose) để có CPU ổn định. ☁️"
  },
  {
    content:
      "🔥 [System Design] Lỗi 'Positive Feedback Loop' trong cơ chế Auto-scaling. \n🛠️ Cách fix: Cấu hình 'Cooldown Period' đủ lâu để hệ thống ổn định trước khi quyết định scale tiếp. 📈"
  },
  {
    content:
      "🔧 [Flutter] Lỗi 'Skia Shader Compilation' gây giật lag (jank) lần đầu mở app. \n🛠️ Cách fix: Sử dụng 'Impeller' engine (trên iOS) hoặc thực hiện 'Shader Warm-up' trước khi release. 📱"
  },
  {
    content:
      "🛑 [Microservices] Lỗi 'Cyclic Dependencies' làm cụm service không thể khởi động tuần tự. \n🛠️ Cách fix: Sử dụng Service Registry và cơ chế Lazy Initialization cho các phụ thuộc chéo. 🏗️"
  },
  {
    content:
      "🌐 [Web Security] Lỗi 'Content-Type Sniffing' dẫn đến thực thi mã độc từ file tải lên. \n🛠️ Cách fix: Cấu hình Header 'X-Content-Type-Options: nosniff' và validate MIME type thực tế của file. 🛡️"
  },
  {
    content:
      "🏗️ [Kubernetes] Lỗi 'Node OOM' do K8s không tính toán được RAM của các process chạy ngoài container. \n🛠️ Cách fix: Cấu hình 'system-reserved' và 'kube-reserved' để dành riêng RAM cho OS và Kubelet. 🎡"
  },
  {
    content:
      "🛡️ [Auth] Lỗi 'Session Fixation' - Không đổi Session ID sau khi đăng nhập. \n🛠️ Cách fix: Luôn gọi hàm regenerate session sau khi xác thực người dùng thành công. 🔑"
  },
  {
    content:
      "📊 [Monitoring] Lỗi 'High Cardinality' làm sập hệ thống lưu trữ Metrics (Prometheus). \n🛠️ Cách fix: Hạn chế dùng các label có giá trị biến thiên vô hạn (như user_id, email) trong metrics. 📊"
  },
  {
    content:
      "🧱 [Infrastructure] Lỗi 'VPC Peering Loop' hoặc sai lệch Route Table. \n🛠️ Cách fix: Thiết kế sơ đồ mạng Hub-and-Spoke bằng AWS Transit Gateway để quản lý kết nối tập trung. 🏗️"
  },
  {
    content:
      "⚙️ [Node.js] Lỗi 'ERR_STREAM_WRITE_AFTER_END'. \n🛠️ Cách fix: Kiểm tra sự kiện 'finish' của stream trước khi thực hiện thêm bất kỳ lệnh ghi nào. ⚙️"
  },
  {
    content:
      "🌀 [Redis] Lỗi 'Replication Lag' cực cao làm dữ liệu ở Slave bị cũ quá lâu. \n🛠️ Cách fix: Kiểm tra băng thông mạng và tối ưu hóa các lệnh ghi nặng (như mset với hàng nghìn key). 💾"
  },
  {
    content:
      "💉 [Database] Lỗi 'Index Corruption' làm query trả về kết quả sai hoặc thiếu. \n🛠️ Cách fix: Sử dụng lệnh 'REINDEX' hoặc 'VACUUM FULL' để xây dựng lại cây index từ dữ liệu gốc. 🗃️"
  },
  {
    content:
      "📦 [DevOps] Lỗi 'Image Pull Secret' hết hạn trong K8s. \n🛠️ Cách fix: Sử dụng các công cụ tự động cập nhật secret (như External Secrets Operator) từ Vault/AWS Secrets Manager. 🛡️"
  },
  {
    content:
      "🧩 [NestJS] Lỗi 'Request Scope Leak' - Dữ liệu của request này rò rỉ sang request khác. \n🛠️ Cách fix: Tuyệt đối không lưu dữ liệu request vào biến static hoặc singleton service; dùng CLS-Hooked nếu cần. 🧩"
  },
  {
    content:
      "🔐 [Crypto] Lỗi 'Predictable IV' làm lộ mẫu mã hóa trong AES-CBC. \n🛠️ Cách fix: Luôn tạo IV ngẫu nhiên (crypto.randomBytes) cho mỗi bản ghi và lưu IV cùng với bản mã. 🔐"
  },
  {
    content:
      "🚦 [API Design] Lỗi 'Breaking Change' khi đổi kiểu dữ liệu của một field mà không versioning. \n🛠️ Cách fix: Sử dụng 'Feature Flags' hoặc 'Semantic Versioning' (v1, v2) để duy trì tính tương thích ngược. 🚦"
  },
  {
    content:
      "🏗️ [TypeORM] Lỗi 'Memory Leak' do bật Logging toàn bộ query trong môi trường Production. \n🛠️ Cách fix: Chỉ bật log cho các query chậm (slow_query_log) hoặc lỗi, và giới hạn kích thước file log. 🏗️"
  },
  {
    content:
      "☁️ [AWS] Lỗi 'S3 Partial Upload Leak' - Các part upload dang dở vẫn bị tính phí lưu trữ. \n🛠️ Cách fix: Cấu hình 'Lifecycle Policy' để tự động xóa các 'Incomplete Multipart Uploads' sau 7 ngày. ☁️"
  },
  {
    content:
      "🛠️ [System Design] Lỗi 'Database Connection Storm' khi toàn bộ service đồng loạt khởi động lại. \n🛠️ Cách fix: Triển khai 'Connection Pooling' ở tầng Proxy (như PgBouncer) và giới hạn tốc độ kết nối mới. 🏗️"
  },
  {
    content:
      "📝 [Logging] Lỗi 'Log Blocking' làm giảm throughput của ứng dụng do ghi log đồng bộ. \n🛠️ Cách fix: Sử dụng Async Logging (ví dụ: pino với thread-stream) để không làm block Event Loop. 📝"
  },
  {
    content:
      "🧪 [Frontend] Lỗi 'Hydration Mismatch' trong Next.js do dùng dữ liệu ngẫu nhiên (Math.random) khi render. \n🛠️ Cách fix: Chỉ thực hiện các logic tạo dữ liệu ngẫu nhiên trong 'useEffect' sau khi component đã mount. 🧪"
  },
  {
    content:
      "🔧 [ESLint] Lỗi 'No-await-in-loop' làm code chạy chậm theo cấp số nhân. \n🛠️ Cách fix: Sử dụng 'Promise.all()' để thực hiện các task không phụ thuộc nhau một cách song song. ✅"
  },
  {
    content:
      "🗄️ [Mongoose] Lỗi 'VersionError' (__v mismatch) khi nhiều tiến trình update cùng một document. \n🛠️ Cách fix: Sử dụng 'atomic operators' ($set, $inc) thay vì .save() nếu không cần kiểm tra logic version. 💾"
  },
  {
    content:
      "🛡️ [Security] Lỗi 'Insecure Deserialization' từ dữ liệu đầu vào của người dùng. \n🛠️ Cách fix: Tránh dùng các hàm như 'eval()' hoặc deserialize object phức tạp; ưu tiên JSON.parse(). 🛡️"
  },
  {
    content:
      "🌐 [CDN] Lỗi 'Cache Poisoning' - Hacker gửi header lạ làm CDN cache response lỗi cho mọi người dùng. \n🛠️ Cách fix: Cấu hình CDN chỉ cache các header chuẩn và ignore các header lạ từ client. 🌐"
  },
  {
    content:
      "🚀 [Performance] Lỗi 'Invisible Re-renders' do Context Provider bọc quá nhiều component. \n🛠️ Cách fix: Chia nhỏ Context hoặc sử dụng các thư viện state management có cơ chế 'selector' như Zustand/Redux. 🖼️"
  },
  {
    content:
      "⚙️ [Node.js] Lỗi 'Unhandled Exception' trong Worker Threads làm sập thread mà không báo lỗi cho main. \n🛠️ Cách fix: Luôn lắng nghe sự kiện 'error' trên mỗi worker instance để thực hiện xử lý lỗi hoặc khởi động lại. ⚙️"
  },
  {
    content:
      "📦 [K8s] Lỗi 'Port Exhaustion' trên Node khi có hàng nghìn Service/Pod giao tiếp liên tục. \n🛠️ Cách fix: Tăng dải 'ip_local_port_range' và tối ưu hóa 'tcp_tw_reuse' trong sysctl của Node. 🎡"
  },
  {
    content:
      "🧩 [NestJS] Lỗi 'Global Interceptor' làm sai lệch kiểu dữ liệu của WebSocket response. \n🛠️ Cách fix: Kiểm tra context type trong interceptor và bỏ qua xử lý nếu là 'ws' (WebSocket). 🔌"
  },
  {
    content:
      "💾 [Redis] Lỗi 'Stale Read' từ Slave do Master chưa kịp đồng bộ khi Slave được thăng cấp. \n🛠️ Cách fix: Sử dụng lệnh 'WAIT' để đảm bảo dữ liệu đã được ghi xuống số lượng slave nhất định trước khi phản hồi. 💾"
  },
  {
    content:
      "🛡️ [Auth] Lỗi 'JWT Alg None' - Hacker đổi thuật toán sang 'none' để bypass verify. \n🛠️ Cách fix: Luôn chỉ định rõ thuật toán cho phép (ví dụ: ['HS256']) khi gọi hàm verify(). 🛡️"
  },
  {
    content:
      "🔀 [Git] Lỗi 'Binary Merge Conflict' - Không thể tự merge file hình ảnh hoặc file nén. \n🛠️ Cách fix: Cấu hình '.gitattributes' để Git nhận diện đúng file binary và xử lý theo cơ chế 'ours' hoặc 'theirs'. 🔀"
  },
  {
    content:
      "🧱 [Docker] Lỗi 'Zombie Process' làm cạn kiệt bảng Process ID (PID) của hệ thống. \n🛠️ Cách fix: Sử dụng '--init' flag hoặc dùng 'dumb-init' làm entrypoint để quản lý tín hiệu và thu hồi process con. 🧱"
  },
  {
    content:
      "📡 [Kafka] Lỗi 'Message Duplication' do Consumer không commit kịp trước khi bị rebalance. \n🛠️ Cách fix: Thiết kế logic xử lý dữ liệu có tính 'Idempotent' (xử lý nhiều lần vẫn ra một kết quả). 📡"
  },
  {
    content:
      "🧪 [Postman] Lỗi 'Environment Variable Leak' khi share collection công khai. \n🛠️ Cách fix: Luôn dùng 'Initial Value' là rỗng và chỉ điền secret vào 'Current Value' (không đồng bộ lên cloud). 🧪"
  },
  {
    content:
      "🔧 [TS] Lỗi 'Recursive Type' quá sâu làm treo VS Code. \n🛠️ Cách fix: Sử dụng Interface thay cho Type alias để tận dụng khả năng cache và merge của compiler. 🔧"
  },
  {
    content:
      "🏗️ [System Design] Lỗi 'Database Over-sharding' làm tăng độ phức tạp khi cần join dữ liệu. \n🛠️ Cách fix: Chỉ thực hiện sharding khi thực sự cần thiết, ưu tiên tối ưu hóa index và nâng cấp phần cứng (Vertical Scaling). 🏗️"
  },
  {
    content:
      "🗃️ [PostgreSQL] Lỗi 'Multixact Member Overflow' do có quá nhiều row-level locks. \n🛠️ Cách fix: Tránh các transaction giữ lock lâu trên nhiều hàng dữ liệu đồng thời. 🗃️"
  },
  {
    content:
      "🔌 [Websocket] Lỗi 'Connection Storm' khi app mobile đồng loạt kết nối lại sau khi mất mạng. \n🛠️ Cách fix: Sử dụng 'Exponential Backoff' cho logic reconnect ở phía Client. 🔌"
  },
  {
    content:
      "🛡️ [Security] Lỗi 'Host Header Injection' qua các link reset password. \n🛠️ Cách fix: Luôn lấy domain từ file config tĩnh thay vì tin tưởng vào header 'Host' từ request. 🛡️"
  },
  {
    content:
      "📂 [Linux] Lỗi 'Disk Latency' cao do Swap bị sử dụng quá mức (Thrashing). \n🛠️ Cách fix: Giảm 'swappiness' về 1-10 và ưu tiên tăng RAM thực cho server. 📂"
  },
  {
    content:
      "🚀 [Next.js] Lỗi 'Build Size' quá lớn do include cả node_modules của backend vào bundle frontend. \n🛠️ Cách fix: Sử dụng 'output: standalone' trong next.config.js để tách biệt môi trường chạy. 🚀"
  },
  {
    content:
      "⚙️ [Express] Lỗi 'Memory Leak' do lưu trữ user session trong bộ nhớ mặc định (MemoryStore). \n🛠️ Cách fix: Luôn sử dụng Redis hoặc Database để lưu session trong môi trường Production. ⚙️"
  },
  {
    content:
      "🧩 [NestJS] Lỗi 'Scope Mismatch' - Inject một REQUEST scope service vào một SINGLETON service. \n🛠️ Cách fix: Singleton service sẽ biến service được inject thành singleton theo, cần dùng 'ModuleRef' để lấy instance thủ công. 📉"
  },
  {
    content:
      "🛡️ [OAuth2] Lỗi 'Authorization Code Injection' do thiếu tham số 'code_challenge' (PKCE). \n🛠️ Cách fix: Luôn triển khai PKCE (Proof Key for Code Exchange) ngay cả cho các client phía server. 🛡️"
  },
  {
    content:
      "🧪 [Jest] Lỗi 'Open Handles' làm test không kết thúc được. \n🛠️ Cách fix: Đóng toàn bộ database connection, server, và dọn dẹp timers trong block 'afterAll'. 🧪"
  },
  {
    content:
      "🔧 [Frontend] Lỗi 'Flicker' khi chuyển trang do không giữ được scroll position. \n🛠️ Cách fix: Sử dụng các thư viện router hỗ trợ 'scroll restoration' hoặc lưu vị trí vào session storage. 🖼️"
  },
  {
    content:
      "📊 [Database] Lỗi 'Predicate Pushdown' bị hỏng làm DB phải quét toàn bộ bảng. \n🛠️ Cách fix: Đảm bảo các hàm xử lý dữ liệu không được bọc quanh cột trong câu lệnh WHERE (SARGable). 📊"
  },
  {
    content:
      "🧱 [Docker] Lỗi 'OverlayFS' hết dung lượng do không dọn dẹp các layer cũ (Dangling). \n🛠️ Cách fix: Định kỳ chạy 'docker system prune' để giải phóng không gian ổ đĩa. 🏗️"
  },
  {
    content:
      "⚙️ [Node.js] Lỗi 'Illegal Instruction' khi chạy app trên CPU quá cũ hoặc thiếu tập lệnh AVX. \n🛠️ Cách fix: Kiểm tra môi trường build và đảm bảo target đúng kiến trúc CPU của server đích. 🛑"
  },
  {
    content:
      "📡 [Kafka] Lỗi 'Log Retention' không xóa file cũ làm đầy đĩa. \n🛠️ Cách fix: Kiểm tra cấu hình 'retention.ms' và 'retention.bytes', đảm bảo 'segment.ms' không quá lớn. 📡"
  },
  {
    content:
      "🗄️ [MongoDB] Lỗi 'Working Set' lớn hơn RAM làm tăng Disk I/O. \n🛠️ Cách fix: Tối ưu index để chỉ các field cần thiết được nạp vào RAM, hoặc nâng cấp RAM của server. 💾"
  },
  {
    content:
      "🧪 [Testing] Lỗi 'Flaky UI Test' do tốc độ mạng thay đổi. \n🛠️ Cách fix: Sử dụng cơ chế 'Wait for element' thay vì dùng 'sleep/timeout' cứng trong code test. 🧪"
  },
  {
    content:
      "🏗️ [Microservices] Lỗi 'Distributed Tracing Gap' - Mất dấu request khi đi qua Message Queue. \n🛠️ Cách fix: Đóng gói trace ID vào 'metadata' hoặc 'header' của message để consumer có thể tiếp tục vết. 🏗️"
  },
  {
    content:
      "🛠️ [NestJS] Lỗi 'TypeORM entity' không được nhận diện khi dùng CLI migration. \n🛠️ Cách fix: Kiểm tra đường dẫn 'entities' trong DataSource config, đảm bảo bao quát đúng folder chứa file .ts/.js. 🛡️"
  },
  {
    content:
      "🌀 [Redis] Lỗi 'Key Eviction' nhầm các session quan trọng. \n🛠️ Cách fix: Tách riêng Redis cho Cache (LRU policy) và Redis cho Storage (NoEviction policy). 🌀"
  },
  {
    content:
      "🛡️ [Auth] Lỗi 'Password Reset' bị Brute-force do không giới hạn số lần nhập mã. \n🛠️ Cách fix: Áp dụng Rate Limit cho các endpoint nhạy cảm dựa trên IP và Account ID. 🔐"
  },
  {
    content:
      "📦 [NPM] Lỗi 'Peer Dependency Conflict' làm treo quá trình cài đặt. \n🛠️ Cách fix: Sử dụng '--legacy-peer-deps' hoặc chỉnh sửa thủ công để các library dùng chung một version của dependency. 📦"
  },
  {
    content:
      "⚙️ [Express] Lỗi 'Large Body' làm sập process do không giới hạn kích thước JSON. \n🛠️ Cách fix: Cấu hình 'express.json({ limit: \"1mb\" })' để chặn các request quá lớn từ client. ⚙️"
  },
  {
    content:
      "🔌 [Mongoose] Lỗi 'Missing index for unique' sau khi xóa database. \n🛠️ Cách fix: Gọi 'Model.createIndexes()' để đảm bảo các index duy nhất được khởi tạo đầy đủ tại runtime. 🔌"
  },
  {
    content:
      "🛡️ [CORS] Lỗi 'Preflight request' bị fail do thiếu header 'Access-Control-Allow-Private-Network'. \n🛠️ Cách fix: Cấu hình server để phản hồi header này nếu app được truy cập từ mạng nội bộ. 🛡️"
  },
  {
    content:
      "🚀 [Heroku] Lỗi 'H12 Request Timeout' do xử lý ảnh quá nặng trên web process. \n🛠️ Cách fix: Đẩy các task nặng sang 'Worker process' và dùng Message Queue để thông báo kết quả. 🚀"
  },
  {
    content:
      "📂 [Multer] Lỗi 'Filename collision' khi hai user upload file trùng tên cùng lúc. \n🛠️ Cách fix: Luôn đổi tên file sang UUID hoặc thêm timestamp vào tên file trước khi lưu trữ. 📂"
  },
  {
    content:
      "🧪 [Jest] Lỗi 'ReferenceError: TextEncoder is not defined' (Node 16+). \n🛠️ Cách fix: Import và gắn TextEncoder vào 'global' trong file jest.setup.js. 🧪"
  },
  {
    content:
      "🔧 [TypeScript] Lỗi 'Type narrowing' không hoạt động với các hàm callback. \n🛠️ Cách fix: Sử dụng biến tạm để lưu giá trị đã được check type trước khi đưa vào callback. 🔧"
  },
  {
    content:
      "🏗️ [NestJS] Lỗi 'Provider provided twice' do import cả module chứa provider và chính provider đó. \n🛠️ Cách fix: Chỉ import Module, không khai báo lại provider trong mảng 'providers' của module hiện tại. 🔄"
  },
  {
    content:
      "🗃️ [PostgreSQL] Lỗi 'Out of memory' khi dùng 'ORDER BY' trên bảng cực lớn mà không có index. \n🛠️ Cách fix: Tăng 'work_mem' cho transaction hoặc (tốt hơn) là tạo index phù hợp để tránh sort trên đĩa. 🗃️"
  },
  {
    content:
      "📡 [GraphQL] Lỗi 'Depth limit exceeded' do client gọi query lồng nhau quá nhiều cấp. \n🛠️ Cách fix: Sử dụng thư viện 'graphql-depth-limit' để chặn các query có nguy cơ làm sập server. 📡"
  },
  {
    content:
      "🛡️ [Argon2] Lỗi 'Memory cost' quá cao làm server hết RAM khi có nhiều request login đồng thời. \n🛠️ Cách fix: Cân đối giữa tính bảo mật và tài nguyên server, sử dụng thông số benchmark chính thức từ Argon2. 🧠"
  },
  {
    content:
      "⚙️ [Node.js] Lỗi 'ERR_HTTP2_SESSION_ERROR' khi kết nối HTTP/2 bị đứt đột ngột. \n🛠️ Cách fix: Triển khai cơ chế retry logic ở phía client và giám sát độ ổn định của kết nối mạng. ❌"
  },
  {
    content:
      "📦 [Docker] Lỗi 'Mount denied' khi dùng Docker Desktop trên Windows/Mac. \n🛠️ Cách fix: Kiểm tra quyền truy cập thư mục trong Settings của Docker Desktop (File Sharing). 🏗️"
  },
  {
    content:
      "🧪 [Mocha] Lỗi 'Uncaught error outside test' làm dừng toàn bộ quá trình chạy test. \n🛠️ Cách fix: Đảm bảo mọi code async đều nằm trong block 'it' hoặc 'before/after' và được bọc try-catch. 🧪"
  },
  {
    content:
      "🛠️ [NestJS] Lỗi 'ValidationPipe' bỏ qua các field không có decorator. \n🛠️ Cách fix: Bật option 'whitelist: true' và 'forbidNonWhitelisted: true' để bắt lỗi khi client gửi dữ liệu lạ. ✅"
  },
  {
    content:
      "🌐 [Axios] Lỗi 'Uncaught (in promise)' khi không có catch cho request lỗi. \n🛠️ Cách fix: Luôn bọc lời gọi axios trong try-catch hoặc sử dụng .catch() để xử lý các mã lỗi 4xx/5xx. 📡"
  },
  {
    content:
      "🗄️ [Sequelize] Lỗi 'N+1 queries' khi dùng vòng lặp để fetch dữ liệu quan hệ. \n🛠️ Cách fix: Sử dụng option 'include' (Eager Loading) để JOIN các bảng liên quan trong một câu query duy nhất. 🗃️"
  },
  {
    content:
      "🛡️ [XSS] Lỗi 'SVG upload' chứa script độc hại (<script> bên trong file .svg). \n🛠️ Cách fix: Sanitize file SVG bằng thư viện chuyên dụng hoặc cấu hình Header 'Content-Security-Policy' phù hợp. 🛡️"
  },
  {
    content:
      "⚙️ [Linux] Lỗi 'Interrupt latency' do card mạng quá tải. \n🛠️ Cách fix: Bật tính năng 'Receive Side Scaling' (RSS) và tối ưu hóa hàng đợi ngắt (Interrupt Request) trên CPU. 📁"
  }
]

const MY_ID = new ObjectId('69708f6ab776baa192a24a3f')
const MY_USERNAME = '@liem_buithanh'

async function createRandomTweets(user: Pick<IUser, '_id' | 'username'>) {
  logger.info('Start create tweet...')

  await Promise.all(
    tweets.map(async (tw) =>
      TweetsService.create(user._id!.toString(), {
        content: tw.content,
        type: ETweetType.Tweet,
        audience: ETweetAudience.Everyone
      })
    )
  )

  logger.info('Finish create tweet')
}

export async function startMockDataTweets() {
  await createRandomTweets({ _id: MY_ID, username: MY_USERNAME })
}
