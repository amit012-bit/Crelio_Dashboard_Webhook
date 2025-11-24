# MongoDB Atlas Setup Guide

## Connection String

Your MongoDB Atlas credentials:
- **Username**: `crelio_dashboard`
- **Password**: `3rtQwcXI3eMo07aa`
- **Cluster**: `cluster0.obzw1pf.mongodb.net`

## Connection String Format

```
mongodb+srv://crelio_dashboard:3rtQwcXI3eMo07aa@cluster0.obzw1pf.mongodb.net/crelio_dashboard?retryWrites=true&w=majority
```

**Important**: Replace `cluster0.xxxxx` with your actual cluster URL from MongoDB Atlas.

## Steps to Get Your Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Click on "Connect" button for your cluster
4. Select "Connect your application"
5. Copy the connection string
6. Replace `<password>` with `3rtQwcXI3eMo07aa`
7. Replace `<dbname>` with `crelio_dashboard`
8. Update the cluster URL (replace `cluster0.xxxxx` with your actual cluster)

## Example .env File

```env
MONGODB_URI=mongodb+srv://crelio_dashboard:3rtQwcXI3eMo07aa@cluster0.obzw1pf.mongodb.net/crelio_dashboard?retryWrites=true&w=majority
```

## IP Whitelist

Make sure to add your IP address to the MongoDB Atlas IP whitelist:
1. Go to Network Access in MongoDB Atlas
2. Click "Add IP Address"
3. Add your current IP or use `0.0.0.0/0` for development (not recommended for production)

## Database Name

The application will create a database named `crelio_dashboard` automatically when you first connect.

## Collections Created

The following collections will be created automatically:
- `patients` - Patient records
- `doctors` - Doctor information
- `reports` - Lab reports
- `labs` - Laboratory information

